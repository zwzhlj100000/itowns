# -*- coding: utf-8 -*-
"""
/***************************************************************************
 iTowns
                                 A QGIS plugin
 3D web view with iTowns
                             -------------------
        begin                : 2017-07-19
        copyright            : (C) 2017 by gmaillet
        email                : gregoire.maillet@gmail.com
        git sha              : $Format:%H$
 ***************************************************************************/

/***************************************************************************
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 ***************************************************************************/
 This script initializes the plugin, making it known to QGIS.
"""


# noinspection PyPep8Naming
def classFactory(iface):  # pylint: disable=invalid-name
    """Load iTowns class from file iTowns.

    :param iface: A QGIS interface instance.
    :type iface: QgsInterface
    """
    #
    from .itowns import iTowns
    return iTowns(iface)
