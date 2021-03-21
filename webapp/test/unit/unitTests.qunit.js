/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"estudo_vizframe_estoque_material/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
