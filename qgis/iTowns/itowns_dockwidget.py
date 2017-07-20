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

from PyQt4 import QtGui, uic
from PyQt4.QtCore import QUrl
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
	self.webview.setUrl(QUrl("http://localhost:8080"))
	self.buttonInspector = QtGui.QPushButton('Inspector', self)
	self.buttonInspector.clicked.connect(self.handleButtonInspector)
	self.gridLayout.addWidget(self.buttonInspector)
	self.buttonCenter3D = QtGui.QPushButton('Center the 3D view on the 2D view', self)
	self.buttonCenter3D.clicked.connect(self.handleButtonCenter3D)
	self.gridLayout.addWidget(self.buttonCenter3D)
	self.buttonCenter2D = QtGui.QPushButton('Center the 2D view on the 3D view', self)
	self.gridLayout.addWidget(self.buttonCenter2D)
	self.buttonCenter2D.clicked.connect(self.handleButtonCenter2D)

    def handleButtonCenter3D(self):
	crsiTowns = QgsCoordinateReferenceSystem(4326)
	crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
	xform = QgsCoordinateTransform(crsCanvas, crsiTowns)
	pt = xform.transform(iface.mapCanvas().center())
	self.webview.page().mainFrame().evaluateJavaScript("itowns.viewer.setCameraTargetGeoPosition({longitude:"+str(pt.x())+", latitude:"+str(pt.y())+"},true)")


    def handleButtonCenter2D(self):
	crsiTowns = QgsCoordinateReferenceSystem(4326)
	crsCanvas = iface.mapCanvas().mapRenderer().destinationCrs()
	xform = QgsCoordinateTransform(crsiTowns, crsCanvas)
	lon = self.webview.page().mainFrame().evaluateJavaScript("itowns.viewer.getCameraTargetGeoPosition().longitude()")
	lat = self.webview.page().mainFrame().evaluateJavaScript("itowns.viewer.getCameraTargetGeoPosition().latitude()")
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
