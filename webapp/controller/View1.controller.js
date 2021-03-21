sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	"sap/viz/ui5/data/FlattenedDataset",
	"sap/viz/ui5/controls/common/feeds/FeedItem",
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller,JSONModel,Filter,FilterOperator,FlattenedDataset,FeedItem) {
		"use strict";

		return Controller.extend("estudovizframeestoquematerial.controller.View1", {

			onInit: function () {

				// Carrega Combobox Sub Categorias
				this._loadSubCatComboBox( );
      
			},

			onChangeSubCat: function (oEvent) {

				// Carrega Combobox Material
			 	 this._loadMaterialComboBox(oEvent);


			}, 	

			onSearch: function (oEvent) {

				// Carrega Gráfico
				this._loadChart( );

			},

// FUNÇÕES			
			_loadSubCatComboBox: function ( ) {

				// 1.1 Faz a leitura do EntitySet 
				this.getOwnerComponent()
				.getModel()
				.read("/SubCategories", {
				  // Se leu com sucesso	
				  success: function (oData) {
					
					//Pega o resultado da leitura
					let oDataModel = oData.results;
					
					// Cria um JSONModel
					let SubCatModel = new JSONModel(oDataModel);
					
					//Para a View Atual, seta o modelo com a variavel do modelo e 
					// o nome que o modelo terá na view "werksOdata"
					 this.getView().setModel(SubCatModel, "SubCatOdata");
				  }.bind(this),
				  error: function (e) {},
				});


			},
			_loadMaterialComboBox: function (oEvent) {
			
				// Busca Subcategoria selecionada
				let currentSubCat = oEvent.getSource().getSelectedKey();

				// Limpa Combobox de Material
				// this.getView().byId("idMaterialComboBox").setSelectedKey("");

				// Cria filtro (Obs: SubCategoryId) é o nome do parametro na URL
				// Ex:sap/opu/odata/sap/EPM_REF_APPS_SHOP_SRV/Products?$filter= (SubCategoryId eq 
				// 'Notebooks')
				let filters = [new Filter("SubCategoryId", FilterOperator.EQ, currentSubCat)];

				// Lê o EntitySet de Material de trabalho passando o filtro
				this.getOwnerComponent()
					.getModel()
					.read("/Products", {
					filters,
					success: function (oData) {
						let oDataModel = oData.results;
		
						let MaterialModel = new JSONModel(oDataModel);
					
						// o nome que o modelo terá na view "MaterialOdata"
						this.getView().setModel(MaterialModel, "MaterialOdata");
					}.bind(this),
					error: function (e) {},
					});

			},
			
			_loadChart: function (oEvent) {
			//sap/opu/odata/sap/EPM_REF_APPS_SHOP_SRV/
			//Products?$filter= (SubCategoryId eq 'Notebooks' or Id = 'HT-XXX')                                                      id eq '')

			    // Busca chaves selecionadas no Combobox
                var currentSubCat = this.getView().byId( "idSubCatComboBox").getSelectedKey();
				var currentMaterial = this.getView().byId( "idMaterialComboBox").getSelectedKeys();
			
				// Filtro para 2 combobox com uma únicao 'Key' cada (abaixo) 				
				//let filters = [new Filter("SubCategoryId", FilterOperator.EQ, currentSubCat),
				//              new Filter("Id", FilterOperator.Contains, currentMaterial)];

				// Cria array de filtro 
				var aFilterFields = [];

				// Inclui campo Sub categoria (única chave) 
				aFilterFields.push (new Filter("SubCategoryId", FilterOperator.EQ, currentSubCat));

				// Loop em array de materiais (seleção multipla)
				for (var i = 0; i < currentMaterial.length; i++) {
                    aFilterFields.push (new Filter("Id", FilterOperator.EQ, currentMaterial[i]));
				}

				let filtersaux = new Filter({ filters: aFilterFields, and: false }); 
				let filters = filtersaux.aFilters;
			

               // Faz a leitura no backend passando o filtro
			   this.getOwnerComponent()
			   .getModel()
			   .read("/Products", {
			       filters,
				 success: function (oData) {

					  // salva retorno do Odata (results) 
                      let dataModel = oData.results;
						
                      // Define tipo de gráfico  
                      var Chart = this.getView().byId( "idChart");
                          Chart.setVizType("timeseries_column"); 

                  // Declara array dos gráficos       
					let result = [];
					let aMeasures = [];
					let aMeasuresFeeds = []; 
					let aDimensions = [];
					let aDimensionsFeeds = [];
                  
				  // Busca data atual
					var today = new Date();
					var dd = String(today.getDate()).padStart(2, '0');
					var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
					var yyyy = today.getFullYear();
					
					//today = dd + '/' + mm + '/' + yyyy;
					  today = yyyy;
					 //today = yyyy + '-' + 'mm' + '-' + dd;


				  // Define Dimensiors	
					aDimensions.push({
						name: `Date`,
						value: `{Date}`,
						dataType: `date`,
					  });
                    
					  aDimensionsFeeds.push(`Date`);


                  // Loop na retorno do Odata (dataModel)
                      for (const {
                        Id,
                        Name,
						StockQuantity,
                      } of dataModel) {

						// Alimenta aMeasures
						aMeasures.push({
							name: `${Id}`,
							value: `{${Id}}`,
						  });
						 
						//Alimenta aMeasuresFeeds  
                        aMeasuresFeeds.indexOf(Id) === -1
                          ? aMeasuresFeeds.push(Id)
                          : null;

						// Alimenta array principal  
						// Nessa lógica abaixo tem '({ ' e diferente do push acima
						  result.push({
						 	Id,
							Name,
							[Id]:StockQuantity, // Cria campo com material e quantidade
							Date: today, // Cria campo com data atual
						  });

					  }		// Fim do FOR

					  // Grava array principal em modelo
                      let oModel = new JSONModel();
                      oModel.setData(result);
                      oModel.refresh();

                      // Inicia criação de gráfico
                      // Define dimensoes/ measures com array alimentado acima
                      let oDataset = new FlattenedDataset({
                        dimensions: aDimensions,
						//dataType: "date"
                        measures: aMeasures,
                        data: {
                          path: "/", // Para pegar local..e nao do /Products
                        },
                      });

					// Seta dimensoes/measures    
					Chart.setDataset(oDataset);

					// Incluí modelo com os dados principais
					Chart.setModel(oModel);

					// Cria FeedItem
					let feedValueAxisActual = new FeedItem({
					uid: "valueAxis",
					type: "Measure",
					values: aMeasuresFeeds,
					}),
					feedTimeAxis = new FeedItem({
					uid: "timeAxis",
					type: "Dimension",
					values: aDimensionsFeeds,
					});			
					
					
                    // Seta FeedItem  
                    Chart.removeAllFeeds();
                    Chart.addFeed(feedValueAxisActual);
                    Chart.addFeed(feedTimeAxis);	

                  // Define propriedades do gráfico
				  Chart.setVizProperties({
					legendGroup: {
					  layout: {
						position: "bottom",
					  },
					},
					legend: {
					  ignoreNoValue: true,
					},
					title: {
					  visible: false,
					},
					plotArea: {
					  dataLabel: {
						visible: false,
					  },
					  window: {
						start: "firstDataPoint",
						end: "lastDataPoint",
					  },
					  dataPointSize: {
						min: 60,
						max: 60,
					  },
					},
					dataLabel: { visible: true, showTotal: true },
					valueAxis: {
					  title: {
						visible: true,
						text: "Quantidade em Estoque",
					  },
					},
					timeAxis: {
					  title: {
						visible: false,
					  },
					  levels: ["year"],
					  label: {visible: false}, // valor de tempo

					},
					title: {
					  visible: true,
					},
  
					uiConfig: {
					  applicationSet: "fiori",
					},
				  });				


				}.bind(this),
				error: function (e) {},
			  });	


			}	

		}); // Fim return

	}); // FIm função
