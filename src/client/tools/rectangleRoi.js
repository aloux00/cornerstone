var cornerstoneTools = (function ($, cornerstone, cornerstoneTools) {

    if(cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    // TODO: make a generic data storage mechanism for elements that
    //       gets cleaned up when the element is destroyed
    var toolData = {};

    function onMouseDown(e) {
        var element = e.currentTarget;
        var data = toolData[element];
        if(e.which == data.whichMouseButton) {
            var coords = cornerstone.pageToImage(element, e.pageX, e.pageY);
            data.startX = coords.x;
            data.startY = coords.y;
            data.endX = coords.x;
            data.endY = coords.y;
            data.lengthVisible = true;

            $(document).mousemove(function(e) {
                var coords = cornerstone.pageToImage(element, e.pageX, e.pageY);
                data.endX = coords.x;
                data.endY = coords.y;
                cornerstone.updateImage(element);
            });

            $(document).mouseup(function(e) {
                $(document).unbind('mousemove');
                $(document).unbind('mouseup');
            });
        }
    };

    function calculateMeanStdDev(sp, radius)
    {
        // TODO: Get a real statistics library here that supports large counts
        if(count == 0) {
            return {
                count: count,
                mean: 0.0,
                variance: 0.0,
                stdDev: 0.0
            };
        }

        var diameter = Math.round(radius * 2);
        var radiusSquared = radius * radius;

        var sum = 0;
        var sumSquared =0;
        var count = 0;
        var index =0;

        for(var y=0; y < diameter; y++) {
            for(var x=0; x < diameter; x++) {
                sum += sp[index];
                sumSquared += sp[index] * sp[index];
                count++;
                index++;
            }
        }

        var mean = sum / count;
        var variance = sumSquared / count - mean * mean;

        return {
            count: count,
            mean: mean,
            variance: variance,
            stdDev: Math.sqrt(variance)
        };

        return sum / count;
    }


    function onImageRendered(e)
    {
        var data = toolData[e.detail.element];

        if(data.lengthVisible == false)
        {
            return;
        }

        var width = Math.abs(data.startX - data.endX);
        var height = Math.abs(data.startY - data.endY);
        var radius = Math.max(width, height) / 2;
        var centerX = (data.startX + data.endX) / 2;
        var centerY = (data.startY + data.endY) / 2;

        var left = Math.min(data.startX, data.endX);
        var top = Math.min(data.startY, data.endY);


        var context = e.detail.canvasContext;
        context.beginPath();
        context.strokeStyle = 'white';
        context.lineWidth = e.detail.singlePixelLineWidth;
        context.rect(left, top, width, height);
        context.stroke();
        context.fillStyle = "white";
        context.font = e.detail.mediumFontSize + " Arial";

        var area = width * e.detail.image.columnPixelSpacing * height * e.detail.image.rowPixelSpacing;
        var area = "Area: " + area.toFixed(2) + " mm^2";
        var textSize = context.measureText(area);

        var offset = 15 / e.detail.viewport.scale;
        var textX  = centerX < (e.detail.image.columns / 2) ? centerX + (width /2): centerX - (width/2) - textSize.width;
        var textY  = centerY < (e.detail.image.rows / 2) ? centerY + (height /2): centerY - (height/2);
        // TODO: calculate this in web worker for large pixel counts...
        var storedPixels = cornerstone.getStoredPixels(e.detail.element, centerX - radius, centerY - radius, radius * 2, radius *2);
        var meanStdDev = calculateMeanStdDev(storedPixels, radius);

        context.fillText("Mean: " + meanStdDev.mean.toFixed(2), textX, textY - offset);
        context.fillText("StdDev: " + meanStdDev.stdDev.toFixed(2), textX, textY);
        context.fillText(area, textX, textY + offset);
    };

    function onMouseMove(e)
    {

    };

    function enableRectangleRoi(element, whichMouseButton)
    {
        element.addEventListener("CornerstoneImageRendered", onImageRendered, false);

        var eventData =
        {
            whichMouseButton: whichMouseButton,
            lengthVisible : false,
            startX : 0,
            startY : 0,
            endX : 0,
            endY : 0
        };

        toolData[element] = eventData;

        $(element).mousedown(onMouseDown);

        $(element).mousemove(onMouseMove);

    };

    function disableRectangleRoi(element)
    {
        element.removeEventListener("CornerstoneImageRendered", onImageRendered);
        $(element).unbind('mousedown', onMouseDown);
        toolData[element] = undefined;
    };

    // module/private exports
    cornerstoneTools.enableRectangleRoi = enableRectangleRoi;
    cornerstoneTools.disableRectangleRoi = disableRectangleRoi;

    return cornerstoneTools;
}($, cornerstone, cornerstoneTools));