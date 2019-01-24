# GFBio Search Map Widget

This repository contains a widget in the form of an [OpenSocial Gadget](https://dev.liferay.com/develop/tutorials/-/knowledge_base/6-1/opensocial-gadget-basics) that is compatible with Liferay.
It receives bounding boxes of search results from the GFBio search and visualizes them on a map.

## Important files
* `gfbio_search_visualization.xml`: This is the OpenSocial Gadget definition file.
* `gfbio_search_visualization.html`: This is the file the `iframe` of the widget has to point to.

## API
The widget listens to `gfbio.search.selectedData`.
The event must be of the following form:
```$json
{
    "data": {
        "selected": [{
            "title": "Data Set Title (not displayed)",
            "Author": "Data Set Author (not displayed)",
            "dataCenter": "Data Center Name (not displayed)",
            "color": "Color in Hexadecimal Notation (e.g. #ff0000)",
            "minLongitude": -180,
            "maxLongitude": 180,
            "minLatitude": -90,
            "maxLatitude": 90
        }]
    }
}
```
There can be more than one entry in the `selected` array.
The bounds correspond to the bounding box of the data set in WGS84 format. 
