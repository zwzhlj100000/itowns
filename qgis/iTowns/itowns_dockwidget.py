# -*- coding: utf-8 -*-
"""
/***************************************************************************
 iTownsDockWidget
                                 A QGIS plugin
 3D web view with iTowns
                             -------------------
        begin                : 2017-07-19
        git sha              : $Format:%H$
        copyright            : (C) 2017 by gmaillet
        email                : gregoire.maillet@gmail.com
 ***************************************************************************/

/***************************************************************************
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 ***************************************************************************/
"""

import os

from PyQt4 import QtGui, uic, QtCore
from PyQt4.QtCore import QUrl, QObject
from PyQt4.QtCore import pyqtSignal
from PyQt4.QtWebKit import QWebView , QWebPage, QWebSettings, QWebInspector
from qgis.core import *
from qgis.gui import *
from qgis.utils import *

FORM_CLASS, _ = uic.loadUiType(os.path.join(
    os.path.dirname(__file__), 'itowns_dockwidget_base.ui'))

class MyWebPage(QWebPage):
    def javaScriptConsoleMessage(self, msg, lineNumber, sourceID):
        """print("JsConsole :"+str(sourceID)+':'+str(lineNumber)+' : '+str(msg))"""
        """QtGui.QMessageBox.information(None, "JsConsole",str(sourceID)+':'+str(lineNumber)+' : '+str(msg))"""

class iTownsDockWidget(QtGui.QDockWidget, FORM_CLASS):

    closingPlugin = pyqtSignal()

    def __init__(self, parent=None):
        """Constructor."""
        super(iTownsDockWidget, self).__init__(parent)
        self.setupUi(self)
	self.webview = QWebView()
	self.webview.setPage(MyWebPage())
	self.gridLayout.addWidget(self.webview)
	self.webview.settings().setAttribute(QWebSettings.DeveloperExtrasEnabled, 1)
	self.inspector = QWebInspector()
	self.inspector.hide()
	self.gridLayout.addWidget(self.inspector)
	self.inspector.setPage(self.webview.page())	
	self.webview.setUrl(QUrl("http://localhost:8080/examples/globe.html"))
	self.buttonInspector = QtGui.QPushButton('Inspector', self)
	self.buttonInspector.clicked.connect(self.handleButtonInspector)	
	self.gridLayout.addWidget(self.buttonInspector)
	self.buttonCenter3D = QtGui.QPushButton('Center the 3D view on the 2D view', self)
	self.buttonCenter3D.clicked.connect(self.handleButtonCenter3D)	
	self.gridLayout.addWidget(self.buttonCenter3D)
	self.buttonCenter2D = QtGui.QPushButton('Center the 2D view on the 3D view', self)
	self.gridLayout.addWidget(self.buttonCenter2D)
	self.buttonCenter2D.clicked.connect(self.handleButtonCenter2D)	
        self.buttonImport = QtGui.QPushButton('Import selected features in the 3D view', self)
        self.gridLayout.addWidget(self.buttonImport)
        self.buttonImport.clicked.connect(self.handleImport)

        self.vLayer = iface.activeLayer()
        if self.vLayer != None:
            self.vLayer.editingStarted.connect(self.handleEditingStarted)
            self.vLayer.editingStopped.connect(self.handleEditingStopped)
        #add the main py Object in the Js Context (to trigg python action from Js)
        self.webview.page().mainFrame().addToJavaScriptWindowObject("pyObj", self)

    def debugMessage(self):
        QtGui.QMessageBox.information(None, "Info", "debug")

    @QtCore.pyqtSlot(str)
    def showMessage(self, msg):
        """Open a message box and display the specified message."""
        QtGui.QMessageBox.information(None, "Info", msg)

    @QtCore.pyqtSlot(float, float)
    def pickGeoPosition(self, lon, lat):
        crsiTowns = QgsCoordinateReferenceSystem(4326)
        crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
        xform = QgsCoordinateTransform(crsiTowns, crsCanvas)
        pt = xform.transform(QgsPoint(lon,lat))
        layer = iface.activeLayer()
        feat = QgsFeature(layer.pendingFields())
        feat.setGeometry(QgsGeometry.fromPoint(pt))
        layer.dataProvider().addFeatures([feat])
        iface.mapCanvas().refresh()

    def handleImport(self):
        crsiTowns = QgsCoordinateReferenceSystem(4978)
        crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
        xform = QgsCoordinateTransform(crsCanvas, crsiTowns)
        layer = iface.activeLayer()
        selected_features = layer.selectedFeatures()

        json = '{"metaData":{"formatVersion":3},'
        json += '"materials": [ {"DbgColor" : 15658734, "DbgIndex" : 0,"DbgName" : "dummy","colorDiffuse" : [ 1, 0, 0 ]} ],'
        json += '"vertices": ['
        for i in selected_features:
            pt_canvas = i.geometry().asPoint()
            if pt_canvas:
                pt_itowns = xform.transform(pt_canvas)
                json+=str(pt_itowns.x())+','+str(pt_itowns.y())+',100,'
        json = json[:-1]+'],"faces":[]}'
        #json = '{"metadata": {"version": 4,"type": "BufferGeometry","generator": "BufferGeometryExporter"},'
        #json += '"data": {"attributes": { "position": { "itemSize": 3, "type": "Float32Array","array":['
        #for i in selected_features:
        #    pt_canvas = i.geometry().asPoint()
        #    if pt_canvas:
        #        pt_itowns = xform.transform(pt_canvas)
        #        json+=str(pt_itowns.x())+','+str(pt_itowns.y())+',100,'
        #json = json[:-1]+']}}}}'
        QtGui.QMessageBox.information(None, "Info", json)
        self.webview.page().mainFrame().evaluateJavaScript("globeView.controls.loadJSON('"+json+"')")


    def handleEditingStarted(self):
        self.webview.page().mainFrame().evaluateJavaScript("document.getElementById('viewerDiv').addEventListener('click',clickCallback,false)")

    def handleEditingStopped(self):
        self.webview.page().mainFrame().evaluateJavaScript("document.getElementById('viewerDiv').removeEventListener('click',clickCallback,false)")

    def handleButtonCenter3D(self):
	crsiTowns = QgsCoordinateReferenceSystem(4326)
	crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
	xform = QgsCoordinateTransform(crsCanvas, crsiTowns)
	pt = xform.transform(iface.mapCanvas().center())
	self.webview.page().mainFrame().evaluateJavaScript("globeView.controls.setCameraTargetGeoPosition({longitude:"+str(pt.x())+", latitude:"+str(pt.y())+"},true)")

    def handleButtonCenter2D(self):
	crsiTowns = QgsCoordinateReferenceSystem(4326)
	crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
	xform = QgsCoordinateTransform(crsiTowns, crsCanvas)
	lon = self.webview.page().mainFrame().evaluateJavaScript("globeView.controls.getCameraTargetGeoPosition().longitude()")
	lat = self.webview.page().mainFrame().evaluateJavaScript("globeView.controls.getCameraTargetGeoPosition().latitude()")
	pt = xform.transform(QgsPoint(lon,lat))
	rect = QgsRectangle(pt, pt)
	iface.mapCanvas().setExtent(rect)
	iface.mapCanvas().refresh()

    def handleButtonInspector(self):
	if (self.inspector.isVisible()):
		self.inspector.hide()
	else:
		self.inspector.show()

    def closeEvent(self, event):
        self.closingPlugin.emit()
        event.accept()

