

var fill = d3.scale.category10();
// my graph data
var data;

var minNodeSize = 5,
    maxNodeSize = 30,
    padding = 1.5,
    svgX = 0,
    svgY = 200;

var displayingFreq = false;

// var width = 883; andy
var width = 0.8 * window.innerWidth;
var div, svg;

var userIDLengthLimit = 10;


file_suffix = '_proximity_stats';

// The below loads data from server
d3.json('data_ids/cluster_ids.json', function(error, sessionList) {
    if (error) {
        alert("The file containing the list of match IDs does not exist.");
        return console.warn(error);
    }
    dd = sessionList;

    //            console.log(dd);
    var selectUI = d3.select("#level").append("select").attr("id", "drop-down").on("change", updateLevel);
    var options = selectUI.selectAll('option').data(dd); // Data join
    // Enter selection
    options.enter()
        .append("option")
        .text(function(d) {
            return d;
        });
    selectUI.property("value", dd[2]);

    // graph stores the loaded data
    sID = d3.select("#drop-down").node().value;
    console.log(sID);
    d3.json('data/' + sID + file_suffix + '.json', updateJSON);

});


var prevStroke, prevFill, prevFillOpa, prevStrokeOpa, prevTextFill;

/******************** State graph **********************************/

var stateheight = .6 *window.innerWidth;
var stateforce = d3.layout.force()
    .charge(-1500)
    .linkDistance(1000)
    .size([width, stateheight])
    .on("tick", statetick);

//        div = d3.select("body").append("div").attr("class", "left1");
// div = d3.select("#state-graph-div").append("div");//.attr("class", "left1");
div = d3.select("#state-graph-svg");

var appendTextBox = function(parentDiv, width, height, left, top, aText) {
    var labelDiv = parentDiv.append("div")
        .attr("class", "popup")
        .style("width", width.toString() + 'px')
        .style("height", height.toString() + 'px')
        .style("left", left.toString() + 'px')
        .style("top", top.toString() + 'px')
        .style("opacity", 1.0);

    labelDiv.append("text")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text(aText);
};

// width, height, left, top

// appendTextBox(div, 120, 20, 750, 170, 'State Graph');
// appendTextBox(div, 170, 20, 1605, 170, 'Sequence Graph');

// svg = div.append("svg")
//     .attr("width", width)
//     .attr("height", stateheight)
//     //            .attr("x", svgX)
//     //.attr("y", svgY)
//     // .style("border", "4px solid #000")
//
//     .attr("pointer-events", "all")
//     .call(d3.behavior
// 		.zoom()
// 		.on("zoom", stateZoomPan));

svg = div
	.append("div")
	.classed("svg-container", true)
	.append("svg")
    // .attr("width", width)
    // .attr("height", stateheight)
	.attr("preserveAspectRatio", "xMinYMin meet")
	.attr("viewBox", "-500 -500 3000 2500")
	// .classed("svg-content-responsive", true)
    .attr("pointer-events", "all")
    .call(d3.behavior
		.zoom()
		.on("zoom", stateZoomPan));


// the graph components (nodes and links)
var stateSvgContainer = svg.append("g").attr("id", "stategraph_container");


var statelink = stateSvgContainer.append("g").attr("id", "statelink_container").selectAll(".statelink"),
    statenode = stateSvgContainer.append("g").attr("id", "statenode_container").selectAll(".statenode");

// Define markers
// Per-type markers, as they don't inherit styles.
svg.append("defs").selectAll("marker")
    .data(["start", "mid", "end"])
    .enter().append("marker")
    .attr("id", function(d) {
        return d;
    })
    // the region viewable in this marker
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0)
    .attr("markerWidth", 30) //1.5)
    .attr("markerHeight", 30) //1.5)
    .attr("markerUnits", "userSpaceOnUse")

    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

// for sticky drag
var statedrag = stateforce.drag().on("dragstart", dragstart);

/********************* Behavior graph ******************************/


var behaviorheight = 810;

var minDistance = 50,
    maxDistance = 500;

var behaviorforce = d3.layout.force()
    .charge(-100)
    .linkDistance(distanceMapping)
    .size([width, behaviorheight])
    .on("tick", behaviortick);

//        div = d3.select("body").append("div").attr("class", "right1");
//div = d3.select("#behavior-graph-div").append("div");//.attr("class", "left1");
div = d3.select("#behavior-graph-svg");

// svg = div.append("svg")
//     .attr("width", width)
//     .attr("height", behaviorheight)
//     //            .attr("x", svgX)
//     //            .attr("y", svgY)
//     // .style("border", "4px solid #000")
//     .attr("pointer-events", "all")
//     .call(d3.behavior.zoom().on("zoom", behaviorZoomPan));

	svg = div
		.append("div")
		.classed("svg-container", true)
		.append("svg")
	    // .attr("width", width)
	    // .attr("height", stateheight)
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 -500 2000 2000")
		// .classed("svg-content-responsive", true)
	    .attr("pointer-events", "all")
	    .call(d3.behavior
			.zoom()
			.on("zoom", stateZoomPan));


// the graph components (nodes and links)
var behaviorSvgContainer = svg.append("g").attr("id", "graph_container");

var behaviorlink = behaviorSvgContainer.append("g").attr("id", "link_container").selectAll(".behaviorlink"),
    behaviornode = behaviorSvgContainer.append("g").attr("id", "node_container").selectAll(".behaviornode");


// for sticky drag
var behaviordrag = behaviorforce.drag()
    .on("dragstart", behaviorDragstart);


//--------------- Functions ------------
var stateMap = {};
var actionMap = {};
//        var stateChart, actionChart;
function updateJSON(error, json) {

    if (error) {
        alert("Level does not exist!");
        return console.warn(error);
    }
    data = json;

    // width, height, left, top
    //            stateChart = new glyph_statechart("glyph-statechart", 863, 300, 12, 800);
    //            actionChart = new glyph_actionchart("glyph-actionchart", 863, 300, 920, 800);

    // update info on num statenodes and players
    d3.select("#level-id").text(data.level_info);
    d3.select("#num-statenodes").text(data.nodes.length);
    //            d3.selectAll("#num-keys").text(data.level_info.keys.length);
    //            d3.selectAll("#num-bonuses").text(data.level_info.bonuses.length);
    //            d3.select("#num-cogs").text(data.level_info.gears.length);
    //            d3.selectAll("#keys-info").text(data.level_info.keys);
    //            d3.selectAll("#bonus-info").text(bonusArrayToString(data.level_info.bonuses));
    //            d3.select("#cogs-info").text(data.level_info.gears);
    //
    //            d3.select("#level-screenshot").select("img").attr("src", "level"+level+".jpg");
    // construct node map


    //            mdsBehaviorGraph = new glyph_mdsbehaviorgraph("glyph-mds",800,800,200,200);
    //            mdsBehaviorGraph.init(data);

    // set statemap for fast access
    stateMap = {};
    data.nodes.forEach(function(aNode) {
        stateMap[aNode.id] = aNode;
    });

    actionMap = {};
    data.links.forEach(function(aLink) {
        actionMap[aLink.id] = aLink;
    });

    //            stateChart.init(data, stateMap, fill);
    //            actionChart.init(data, actionMap, fill);

    visualizeStateData();

    // update info on num nodes and players
    d3.select("#num-nodes").text(data.trajectories.length);
    d3.selectAll("#num-players").text(data.num_users);
    //            d3.select("#num-complete").text(data.num_complete);
    //            d3.select("#num-incomplete").text(data.trajectories.length-data.num_complete);

    visualizeBehaviorData();
    showLinks = true;
    toggleShowLinks();
}



function updateLevel() {
    clearHighlight();
    // remove the charts
    //            d3.select('#glyph-statechart').remove();
    //            d3.select('#glyph-actionchart').remove();
    sID = d3.select("#drop-down").node().value;

    d3.json('data/' + sID + file_suffix + '.json', updateJSON);
}

/******************** State graph **********************************/
var linearStateNodeScale, linearStateLinkScale;

//        var presetNodes = false;
//        var gravityFocus = {'NEGATIVE': 2, 'NEUTRAL': 1, 'POSITIVE': 0};
//
//        var foci = [{x: 400, y: 100}, {x: 100, y: 600}, {x: 700, y: 600}];

var presetStateNodes = function(nodes) {

    margin = 100;
    maxX = 890;

    nodeSpacing = (maxX - 2 * margin) / 8;
    yNodeSpacing = 200;

    // Prefix positions of start and end nodes------
    nodes[0].fixed = true;
    nodes[0].x = margin; //width / 2;
    nodes[0].y = margin; //stateheight / 2;

    nodes[1].fixed = true;
    nodes[1].x = width - margin;
    nodes[1].y = stateheight - margin;

    //
    //            nodes[1].fixed = true;
    //            nodes[1].x = 2000; //maxX-100; //maxX-margin;
    //            nodes[1].y = -600; //stateheight/2;

    // the rest of the nodes

    //            i=1;
    //            for(var affect=0; affect<3; affect++){
    //
    //                for (var duration=1;duration<=3; duration++){
    //                    for (var size= 0; size < 3; size++){
    ////                        if (presetNodes) nodes[i].fixed = true;
    ////                        else
    //                        nodes[i].y = margin + affect* gravityFocus[nodes[i].details.affect]; // yNodeSpacing;
    //                        nodes[i].x = maxX/2; //margin + ((duration-1)*3 + size)*nodeSpacing;
    //                        i++;
    //                    }
    //                }
    //            }

};

var state_node_label = function(d) {
    //            if (d.type != 'start' && d.type != 'end')
    //                return d.details.event_type;
    //            return "";

    return extractDetails(d.details);

};

var state_link_label = function(d) {
    return d.details;
};

function visualizeStateData() {
    linearStateNodeScale = getStateNodeScale(data.nodes);
    linearStateLinkScale = getStateLinkScale(data.links);

    // Prefix positions of start and end nodes------
    presetStateNodes(data.nodes);
    //---------------------------------------------

    stateforce.nodes(data.nodes)
        .links(data.links);

    statelink = statelink.data(data.links);
    statenode = statenode.data(data.nodes);

    // UPDATE --------------------
    statelink.attr("id", function(d, i) {
            return 'statelink' + d.id;
        })
        .attr("class", updateLinkClass)
        .style("stroke-width", getStrokeWidth)
        .attr("marker-end", function(d) {

            //                    return "url(#" + d.type + ")";
            return "url(#mid)";

        });
    statelink.select("title").text(function(d) {
        return state_link_label(d);
    });

    statenode.attr("id", function(d, i) {
            return 'statenode' + d.id;
        })
        .attr("class", function(d) {
            return "statenode " + d.type;
        })
        .select("circle")
        .attr("class", function(d) {
            return d.type;
        })
        .attr("r", function(d) {
            return linearStateNodeScale(d.user_ids.length);
        });

    statenode.select("text")
        .attr("class", function(d) {
            return d.type;
        })
        .attr("dx", function(d) {
            return linearStateNodeScale(d.user_ids.length);
        })
        .attr("font-size", function(d) {
            return maxNodeSize;
        })
        .text(function(d, i) {
            return state_node_label(d);
        });

    statenode.select("title").text(function(d) {
        return state_node_label(d);
    });


    // ENTER ----------------
    var statelinkGroup = statelink.enter().append("path") //.append("line")
        .attr("class", updateLinkClass)
        .attr("id", function(d, i) {
            return 'statelink' + d.id;
        })
        //                .style("stroke", getLineColor)
        .style("stroke-width", getStrokeWidth)
        .attr("marker-end", function(d) {
            //                    return "url(#" + d.type + ")";
            return "url(#mid)";
        })
        .on("click", stateLinkClicked);

    statelinkGroup.append("title").text(function(d) {
        return state_link_label(d);
    });

    var statenodeGroup = statenode.enter().append("g")
        .attr("class", function(d) {
            return "statenode " + d.type;
        })
        .attr("id", function(d, i) {
            return 'statenode' + d.id;
        })
        .on("dblclick", dblclick)
        .call(statedrag);

    statenodeGroup.append("title").text(function(d) {
        return state_node_label(d);
    });

    statenodeGroup.append("circle")
        .attr("r", function(d) {
            return linearStateNodeScale(d.user_ids.length);
        })
        .on("mouseover", stateDisplayInfo);

    statenodeGroup.append("text")
        .attr("dx", function(d) {
            return linearStateNodeScale(d.user_ids.length);
        })
        .attr("dy", ".35em")
        .attr("class", function(d) {
            return d.type;
        })
        .attr("font-size", function(d) {
            return maxNodeSize;
        })
        .text(function(d, i) {
            return state_node_label(d);
        });

    // EXIT --------------------------------------
    statelink.exit().remove();
    statenode.exit().remove();

    stateforce.start();

}

// flag: 1 - popularity, 2 - look significant
// can create function instead of copying codes
var changeStateNodeSizeType = function(flag) {
    switch (flag) {

        case 1:
            statenode
                .select("circle")
                .attr("r", function(d) {
                    return linearStateNodeScale(d.user_ids.length);
                });
            statenode.select("text")
                .attr("font-size", function(d) {
                    return linearStateNodeScale(d.user_ids.length);
                })
            break;

        case 2:
            statenode
                .select("circle")
                .attr("r", function(d) {
                    if (d.type == 'mid')
                        return linearStateNodeScale(getLookSignificance(d));
                    return maxNodeSize;
                });
            statenode.select("text")
                .attr("font-size", function(d) {
                    if (d.type == 'mid')
                        return linearStateNodeScale(getLookSignificance(d));
                    return maxNodeSize;
                })
            break;

    }
};

function statetick(e) {
    // statelink
    //            statelink.attr("x1", function (d) {
    //                return d.source.x;
    //            })
    //                .attr("y1", function (d) {
    //                    return d.source.y;
    //                })
    //                .attr("x2", function (d) {
    //                    return d.target.x;
    //                })
    //                .attr("y2", function (d) {
    //                    return d.target.y;
    //                });

    statelink.attr("d", function(d) {
        var x1 = d.source.x,
            y1 = d.source.y,
            x2 = d.target.x,
            y2 = d.target.y,
            dx = x2 - x1,
            dy = y2 - y1,
            dr = Math.sqrt(dx * dx + dy * dy),

            // Defaults for normal edge.
            drx = dr,
            dry = dr,
            xRotation = 0, // degrees
            largeArc = 0, // 1 or 0
            sweep = 1; // 1 or 0

        // Self edge.
        if (x1 === x2 && y1 === y2) {
            // Fiddle with this angle to get loop oriented.
            xRotation = -45;

            // Needs to be 1.
            largeArc = 1;

            // Change sweep to change orientation of loop.
            //sweep = 0;

            // Make drx and dry different to get an ellipse
            // instead of a circle.
            drx = 30;
            dry = 20;

            // For whatever reason the arc collapses to a point if the beginning
            // and ending points of the arc are the same, so kludge it.
            x2 = x2 + 1;
            y2 = y2 + 1;
        }

        return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
    });

    statenode
        //                .each(gravity(.2 * e.alpha))
        .each(collide(.5))
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
    //                .attr("cx", function (d) {
    //                    return d.x;
    //                })
    //                .attr("cy", function (d) {
    //                    return d.y;
    //                })
    //                .each(function(d){console.log("d.cy = " + d.cy)});
}


// Move nodes toward cluster focus.
function gravity(alpha) {
    return function(d) {
        if (d.type == 'mid') {
            d.y += (foci[gravityFocus[d.details.affect]].y - d.y) * alpha;
            d.x += (foci[gravityFocus[d.details.affect]].x - d.x) * alpha;
        }
    };
}

function getStrokeWidth(d) {
    //            return Math.sqrt(d.weight);
    return linearStateLinkScale(d.user_ids.length);
    //            return d.user_ids.length;
}

function updateLinkClass(d) {
    return 'statelink mid';
    //            var meaning = getLinkTypeFromMeaning(d.meaning);
    //            if (meaning == 'start')
    //                return "statelink bonus";
    //            return "statelink " + meaning;
}

//
function getLinkTypeFromMeaning(meaning) {

    // collect key
    //            if (meaning.indexOf('k') != -1)
    //                return "end";
    //            if (meaning.indexOf('b') != -1)
    //                return "start";
    //
    return "mid";

}

// set minVisits and maxVisits
//        function getStateNodeScale(dataset) {
//            var minVisits = d3.min(dataset, function (d) {
//                return d.user_ids.length;
//            });
//            var maxVisits = d3.max(dataset, function (d) {
//                return d.user_ids.length;
//            });
//
//            return d3.scale.linear()
//                .domain([minVisits, maxVisits])
//                .range([minNodeSize, maxNodeSize]);
//        }
//
function getStateNodeScale(dataset) {
    var minVisits = d3.min(dataset, function(d) {
        return d.user_ids.length;
    });
    var maxVisits = d3.max(dataset, function(d) {
        return d.user_ids.length;
    });

    return d3.scale.linear()
        .domain([minVisits, maxVisits])
        .range([minNodeSize, maxNodeSize]);
}

function getStateLinkScale(dataset) {
    var minVisits = d3.min(dataset, function(d) {
        return d.user_ids.length;
    });
    var maxVisits = d3.max(dataset, function(d) {
        return d.user_ids.length;
    });

    return d3.scale.linear()
        .domain([minVisits, maxVisits])
        .range([minNodeSize, maxNodeSize]);
}

// collision detection
// Resolves collisions between d and all other circles.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(data.nodes);
    return function(d) {
        // the radius of the current node
        var d_radius = linearStateNodeScale(d.user_ids.length);


        var r = d_radius + maxNodeSize + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;

        quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d_radius + linearStateNodeScale(quad.point.user_ids.length) + padding;
                if (l < r) {
                    l = (l - r) / l * alpha; // padding
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}


function stateZoomPan() {
    stateSvgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function behaviorZoomPan() {
    behaviorSvgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// for sticky drag
// This callback can access this (the DOM object it is called upon)
function dblclick(d) {
    // somehow this works, but
    // d3.event.sourceEvent.stopPropagation(); does not

    d3.event.stopPropagation();
    d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("fixed", d.fixed = true);

    // show state node info
    stateDisplayInfo(d);
}

// display info in textboxes
function stateDisplayInfo(d) {

    d3.select("#statenode-id").text(d.id);
    //            d3.select("#curr-position").text(d.details.position);
    //            d3.select("#num-keys-collected").text(getNumTrue(d.details.keys));
    //            d3.select("#num-bonuses-collected").text(getNumTrue(d.details.items));
    d3.select("#statenode-info").text(extractDetails(d.details));
    d3.select("#statenode-stats").text(extractStats(d.stats));


    d3.select("#num-players-state").text(d.user_ids.length);
    if (d.user_ids.length <= userIDLengthLimit)
        d3.select("#players-state").text(d.user_ids);
    else d3.select("#players-state").text(d.user_ids.slice(0, userIDLengthLimit) + ",....");
}

// display link info in textboxes
function stateLinkClicked(d) {

    //            d3.select("#statelink-act").text(d.num_moves);
    //            d3.select("#statelink-meaning").text(d.meaning);

    d3.select("#num-players-statelink").text(d.user_ids.length);
    if (d.user_ids.length <= userIDLengthLimit)
        d3.select("#players-statelink").text(d.user_ids);
    else d3.select("#players-statelink").text(d.user_ids.slice(0, userIDLengthLimit) + ",....");


    //            <b>Action Link Info</b> (updated when link selected) - Position displacement: <label id="statelink-act"></label>,
    //            effect: <label id="statelink-meaning"></label> <br/>
    //            Player IDs traversing this link (<label id="num-players-statelink"></label> players): <label id="players-statelink"></label><br/>
    d3.select("#statelink-info").text(state_link_label(d));

}

function getNumTrue(itemArray) {
    var result = 0;
    for (var i = 0; i < itemArray.length; i++) {
        if (itemArray[i][2]) result++;
    }
    return result;
}

// index 0: start, index 1: end
function setNodeForFreq(index) {
    var value = d3.select("#statenode-id").text();

    if (index == 0) {
        d3.select("#freq-start-node").node().value = value;
    } else d3.select("#freq-end-node").node().value = value;
}


/*************************** Behavior graph *******************/

var linearScaleBehaviorNode, distanceBehaviorScale;

function visualizeBehaviorData() {
    linearScaleBehaviorNode = getBehaviorNodeScale(data.trajectories);
    distanceBehaviorScale = getBehaviorDistanceScale(data.traj_similarity);

    //            presetStateNodes(data.trajectories);

    behaviorforce.nodes(data.trajectories)
        .links(data.traj_similarity);

    behaviorlink = behaviorlink.data(data.traj_similarity);
    behaviornode = behaviornode.data(data.trajectories);

    behaviorlink.enter().append("line")
        .attr("class", "behaviorlink")
        .attr("id", function(d, i) {
            return 'behaviorlink' + d.id;
        });


    var nodeEnter = behaviornode.enter().append("g")
        //                .attr("class", "behaviornode")
        .attr("class", function(d) {
            if (d.completed)
                return "behaviornode complete";
            return "behaviornode incomplete";
        })
        .attr("id", function(d, i) {
            return 'behaviornode' + i;
        }).on("dblclick", dblclick)
        .on("mouseover", displayInfo)
        .call(behaviordrag);

    nodeEnter.append("circle")
        .attr("r", function(d) {
            return linearScaleBehaviorNode(d.user_ids.length);
        });
    //
    //            nodeEnter.append("title").text(function (d) {
    //                return d.user_ids;
    ////                return d.id;
    //            });
    nodeEnter.append("text")
        .attr("class", function(d) {
            if (d.completed)
                return "complete";
            return "incomplete";
        })
        .attr("dx", function(d) {
            return linearScaleBehaviorNode(d.user_ids.length) + 3;
        })
        .attr("dy", ".35em")
        .attr("font-size", function(d) {

            return maxNodeSize;
            //                        return linearScaleBehaviorNode(d.user_ids.length);
        })
        .text(function(d, i) {
            return i;
        });

    // UPDATE --------------------
    behaviorlink.attr("id", function(d, i) {
            return 'behaviorlink' + d.id;
        })
        .attr("class", "behaviorlink");

    behaviornode.attr("id", function(d, i) {
            return 'behaviornode' + i;
        })
        //                .attr("class", "behaviornode")
        .attr("class", function(d) {
            if (d.completed)
                return "behaviornode complete";
            return "behaviornode incomplete";
        })
        .select("circle")
        .attr("class", function(d) {
            if (d.completed)
                return "complete";
            return "incomplete";
        })
        .attr("r", function(d) {
            return linearScaleBehaviorNode(d.user_ids.length);
        });

    behaviornode.select("text")
        .attr("class", function(d) {
            if (d.completed)
                return "complete";
            return "incomplete";
        })
        .attr("dx", function(d) {
            return linearScaleBehaviorNode(d.user_ids.length) + 3;
        })
        .attr("font-size", function(d) {
            return maxNodeSize;
            //                        return linearScaleBehaviorNode(d.user_ids.length);
        })
        .text(function(d, i) {
            return i;
        });


    behaviorlink.exit().remove();
    behaviornode.exit().remove();

    behaviorforce.start();

}


function distanceMapping(d) {
    return distanceBehaviorScale(d.similarity);
}


function behaviortick() {
    // link ends
    behaviorlink.attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });
    behaviornode //.each(collide(.5))
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
}

// set minValue and maxValue
function getBehaviorNodeScale(dataset) {
    var minValue = d3.min(dataset, function(d) {
        return d.user_ids.length;
    });
    var maxValue = d3.max(dataset, function(d) {
        return d.user_ids.length;
    });
    // if minValue and maxValue are the same,
    // we'll make it such that the node takes the big size.
    if (minValue == maxValue)
        minValue -= 1;
    return d3.scale.linear()
        .domain([minValue, maxValue])
        .range([minNodeSize, maxNodeSize]);
}

function getBehaviorDistanceScale(dataset) {
    var minValue = d3.min(dataset, function(d) {
        return d.similarity;
    });
    var maxValue = d3.max(dataset, function(d) {
        return d.similarity;
    });

    return d3.scale.linear()
        .domain([minValue, maxValue])
        .range([minDistance, maxDistance]);
}

var showLinks = true;

function toggleShowLinks() {
    if (showLinks) {
        d3.selectAll(".behaviorlink").style("stroke", "transparent");
    } else {
        d3.selectAll(".behaviorlink").style("stroke", null);
    }

    showLinks = !showLinks;
}

// display info in textboxes
var displayInfo = function(d, i) {
    var nodeinfo = i + " (";
    if (d.completed) nodeinfo = nodeinfo + "reach end state)";
    else nodeinfo = nodeinfo + "does not reach end state)";

    // the start and end states are dummy
    d3.select("#num-states-in-trajectory").text(d.trajectory.length - 2);
    d3.select("#selected-node-index").text(nodeinfo);
    d3.select("#infobox").text(compressStates(d.trajectory));
    d3.select("#actionseq-info").text(compressArray(d.action_meaning));


    //            d3.select("#infobox-details").text(d.short_meaning);

    d3.select("#num-players-sequence").text(d.user_ids.length);
    if (d.user_ids.length <= userIDLengthLimit)
        d3.select("#players-sequence").text(d.user_ids);
    else d3.select("#players-sequence").text(d.user_ids.slice(0, userIDLengthLimit) + ",....");
};

var extractDetails = function(detail_obj) {
    // movement events: show the region
    if (detail_obj.event_type.indexOf('movement') !== -1)
        return detail_obj.metadata.encounter;
    return detail_obj.event_type;
};


var extractStats = function(stats_obj) {
    // movement events: show the region
    //            console.log(JSON.stringify(stats_obj));
    return JSON.stringify(stats_obj);
};

var compressStates = function(pArray) {

    items = _.map(pArray, function(a) {
        return extractDetails(data.nodes[a].details);
    });
    return compressArray(items);
};

var compressArray = function(pArray) {

    var actions = "";
    var prevAction = "";
    var prevActionCount = 0;
    var currItem;
    for (var i = 1; i < pArray.length - 1; i++) {

        currItem = pArray[i];

        if (prevAction != currItem) {
            if (prevAction != "") {
                actions += prevAction + "(" + prevActionCount.toString() + ")";
                actions += ", ";
            }
            prevAction = currItem;
            prevActionCount = 1;
        } else prevActionCount += 1;

    }
    actions += prevAction + "(" + prevActionCount.toString() + ")";

    return actions;
};


var lowestOpacity = 0.1;

function behaviorDragstart(d, i) {
    d3.event.sourceEvent.stopPropagation();
    //            d3.select(this).classed("fixed", d.fixed = true);

    // Highlight the behavior
    clearHighlight();
    applyOpacity(lowestOpacity);
    highlightBehaviorNodeIndex(i, "red");

    archiveStyle(this);

    // Update chart
    //            stateChart.generateTrajPopup([i], 'red');
    //            actionChart.generateTrajPopup([i], 'red');
}

var archiveStyle = function(domNode) {
    prevStroke = d3.select(domNode).style("stroke");
    prevFill = d3.select(domNode).style("fill");
    prevStrokeOpa = d3.select(domNode).style("stroke-opacity");
    prevFillOpa = d3.select(domNode).style("fill-opacity");

    prevTextFill = d3.select(domNode).select("text").style("fill");
};

var restoreStyle = function(domNode) {
    d3.select(domNode).style("stroke-opacity", prevStrokeOpa)
        .style("stroke", prevStroke)
        .style("fill-opacity", prevFillOpa)
        .style("fill", prevFill);

    d3.select(domNode).select("text").style("fill", prevTextFill);
};

var highlightNodeID = function(reverse = false) {
    // highlight
    nArray = d3.select("#playtrace-index").node().value.trim().split(",");
    //            console.log(nArray);
    if (nArray.length > 0 && nArray[0] !== '') {
        clearHighlight();
        // set crowd opacity to 0.2
        applyOpacity(lowestOpacity);

        if (reverse)
            nArray = nArray.reverse();

        //            console.log(nArray);
        _.each(nArray, function(item, ind) {
            highlightBehaviorNodeIndex(parseInt(item), fill(ind));
        });
        displayInfo(data.trajectories[nArray[0]], nArray[0]);

        // if reverse is set, set the text to the reverse
        if (reverse)
            d3.select("#playtrace-index").node().value = nArray.join();
    }
};

var highlightNodeID_index = function(index = 0) {
    // highlight only the specific index in the
    nArray = d3.select("#playtrace-index").node().value.trim().split(",");

    //            console.log(nArray);
    if (nArray.length > 0 && nArray[0] !== '') {
        clearHighlight();
        // set crowd opacity to 0.2
        applyOpacity(lowestOpacity);

        if (index == -1)
            index = nArray.length - 1;

        highlightBehaviorNodeIndex(parseInt(nArray[index]), fill(index));
    }
};


function showInfoNodeID() {
    var index = parseInt(d3.select("#playtrace-show-info").node().value);
    displayInfo(data.trajectories[index], index);
}
/*************************** Highlighting ******************/


function clearHighlight() {
    // clear all styles for state graph
    d3.selectAll(".statelink,.statenode").style("stroke-opacity", null)
        .style("stroke", null)
        .style("fill", null)
        .style("fill-opacity", null);

    d3.selectAll(".statenode circle").style("fill", null).style("stroke", null);



    d3.selectAll(".statenode").select("text")
        .style("fill", null)
        .style("fill-opacity", null);

    // clear behavior graph
    d3.selectAll(".behaviornode").style("stroke-opacity", null)
        .style("stroke", null)
        .style("fill", null)
        .style("fill-opacity", null);

    d3.selectAll(".behaviornode circle").style("fill", null).style("stroke", null);

    applyOpacity(currentOpacity);

    displayingFreq = false;
}


var highlightUserID = function() {

    clearHighlight();
    input = d3.select("#userID").node().value;


	// $('#clearHighlight').css('background', red);


    // 1. find the user traj from the trajectories

    userIDs = input.split(",");
    //            userIDs = _.map(userIDs, function(anID){
    //                return parseInt(anID);
    //            });

    first_one_highlighted = true;
    _.each(userIDs, function(userID, id) {
        var trajIndex = -1;

        for (var i = 0; i < data.trajectories.length; i++) {
            if (_.contains(data.trajectories[i].user_ids, userID)) {
                trajIndex = i;
                break;
            }
        }

        if (trajIndex >= 0) {

            if (first_one_highlighted) {
                applyOpacity(lowestOpacity);
                first_one_highlighted = false;
            }

            // 2 is red
            highlightBehaviorNodeIndex(trajIndex, fill(id));
            found_user = true;
        } else {
            alert('cant find');
        }
    });

};

// flag: groupKey feature_1
var groupCache = {};
// This function construct the key to retrieve from groupCache
var constructGroupKey = function(feature, groupValue) {
    return feature + '_' + groupValue;
};

//        var highlightGroup = function(groupValue, color) {
//
//            clearHighlight();
//
//
//            feature = d3.select("#personality-feature").node().value.trim();
//
//            // 1. retrieve the key
//            groupKey = constructGroupKey(feature, groupValue);
//            console.log(groupKey);
//            if (groupKey in groupCache) {
//                if (groupCache[groupKey].length > 0) {
//                    applyOpacity(lowestOpacity);
//                    highlightGroupWithColor(groupCache[groupKey], color);
//                } else alert("No user in this group");
//            } else {
//                d3.json('/vpal/personality/' + feature + '/' + groupValue, function(error, result) {
//                    console.log('/vpal/personality/' + feature + '/' + groupValue);
//                    if (error) {
//                        alert("No ID found");
//                        return console.warn(error);
//                    }
//                    groupCache[groupKey] = result;
//                    //console.log(groupCache[groupKey]);
//                    if (groupCache[groupKey].length > 0) {
//                        applyOpacity(lowestOpacity);
//                        highlightGroupWithColor(groupCache[groupKey], color);
//                    } else alert("No user in this group");
//                });
//            }
//
//        };
//
//        var highlightGroupWithColor = function(groupIDs, color) {
//            //console.log("hl group: "+groupIDs);
//            _.each(data.trajectories, function(traj, id) {
//                //console.log("node: " + traj.user_ids);
//                groupIntersect = _.intersection(traj.user_ids, groupIDs);
//                if (groupIntersect.length > 0) {
//                    //console.log("highlight " + id)
//                    highlightBehaviorNodeIndex(id, color);
//                }
//            });
//        };


// flag: 1: team2, blue; 2: team3, red; 0: all
var highlightGroup = function(flag) {
    clearHighlight();
    applyOpacity(lowestOpacity);

    switch (flag) {
        case 1:
            highlightGroupWithName('team2', 'blue');
            break;
        case 2:
            highlightGroupWithName('team3', 'red');
            break;
        default:
            highlightGroupWithName('team2', 'blue');
            highlightGroupWithName('team3', 'red');
    }


};

var highlightGroupWithName = function(grpName, color) {

    _.each(data.trajectories, function(traj, id) {
        if (traj.teams.indexOf(grpName) > -1)

            highlightBehaviorNodeIndex(id, color);
    });
};


function highlightBehaviorNodeIndex(index, color) {

    highlightTraj(data.trajectories[index], color);
    highlightBehaviorNode(index, color);
    displayInfo(data.trajectories[index], index);

    displayingFreq = true;
}

function highlightBehaviorNode(nodeToHighlight, color) {
    d3.select("#behaviornode" + nodeToHighlight).style("stroke-opacity", 1)
        .style("stroke", color)
        .style("fill", color)
        .style("fill-opacity", 1);
    // somehow have to set fill for cirle only.
    d3.select("#behaviornode" + nodeToHighlight).select("circle")
        .style("stroke", color)
        .style("fill", color);
}

function toggleKthTrajectories() {
    clearHighlight();
    applyOpacity(lowestOpacity);
    var numHighlight = parseInt(d3.select("#number-highlight").node().value);
    if (data.hasOwnProperty('trajectories') && numHighlight <= data.trajectories.length) {

        numFrequent = (numHighlight - 1 + data.trajectories.length) % data.trajectories.length;

        highlightBehaviorNodeIndex(numFrequent, fill(numFrequent));

    }

}

function toggleHighlightFreqTrajectories() {
    clearHighlight();

    var numHighlight = parseInt(d3.select("#number-highlight").node().value);
    if (data.hasOwnProperty('trajectories') && numHighlight <= data.trajectories.length) {
        applyOpacity(lowestOpacity);
        numFrequent = numHighlight; // (numHighlight + data.trajectories.length) % data.trajectories.length;

        var bNodeArray = _.range(numFrequent);
        _.each(bNodeArray, function(d) {
            highlightBehaviorNodeIndex(d, fill(d));
        });

        //                stateChart.generateTrajPopup(bNodeArray);
        //                actionChart.generateTrajPopup(bNodeArray);
    }

}

function highlightTraj(trajString, color) {

    // 1. break the trajectory into nodes and statelinks ID
    ids = trajToIDs(trajString);

    // 2. assign the color to a corresponding list of colors.
    d3.selectAll(ids)
        .style("stroke", color)
        .style("stroke-opacity", 1);

    d3.selectAll(ids).select("circle")
        .style("fill-opacity", 1);

    d3.selectAll(ids).select("text")
        .style("fill", 'black')
        //            .style("fill", color)
        .style("fill-opacity", 1);
    //            ;

    //
    //            d3.select("#behaviornode"+nodeToHighlight).style("stroke-opacity", 1)
    //            .style("stroke", color)
    //            .style("fill", color)
    //            .style("fill-opacity", 1);
    //            // somehow have to set fill for cirle only.
    //            d3.select("#behaviornode"+nodeToHighlight).select("circle")
    //            .style("stroke", color)
    //            .style("fill", color);
}


// return: "#statenode975, #statelink975_0, #statenode1015, #statelink1015_0, #statenode475 "
// for "975, 0, 1015, 1015_0, 475"
var trajToIDs = function(traj) {

    pArray = traj.trajectory;

    selectArray = "";

    for (var i = 0; i < pArray.length; i++) {

        selectArray += "#statenode" + pArray[i];

        if (i < pArray.length - 1) {
            selectArray += ", ";
            selectArray += "#statelink" + pArray[i] + "_" + pArray[i + 1] + ", ";

        }
    }

    return selectArray;
};

var currentOpacity = 0.7;

function incrementOpacity() {

    currentOpacity = currentOpacity + 0.1;
    if (currentOpacity > 1) currentOpacity = 1;
    applyOpacity(currentOpacity);

}

function decrementOpacity() {

    currentOpacity = currentOpacity - 0.1;
    if (currentOpacity < 0.2) currentOpacity = 0.2;

    applyOpacity(currentOpacity);
}

function applyOpacity(opacityValue) {

    d3.selectAll(".statelink,.statenode,.behaviorlink,.behaviornode")
        .style("stroke-opacity", opacityValue)
        .style("fill-opacity", opacityValue);
}

var freezeLayout = function() {
    // still moving
    if (behaviorforce.alpha() > 0) {
        stateforce.stop();
        behaviorforce.stop();
    } else {
        stateforce.resume();
        behaviorforce.resume();
    }
}

var allCurrentlyFixed = false;
var fixLayout = function() {
    allCurrentlyFixed = !allCurrentlyFixed;
    d3.selectAll(".statenode,.behaviornode")
        .classed("fixed", function(d) {
            d.fixed = allCurrentlyFixed;
        });
}


var incrementGraph = function(forceChoice) {
    var force = stateforce;
    if (forceChoice > 0)
        force = behaviorforce;
    var currentCharge = force.charge();
    force.charge(currentCharge * 1.5).start();
};

var decrementGraph = function(forceChoice) {
    var force = stateforce;
    if (forceChoice > 0)
        force = behaviorforce;
    var currentCharge = force.charge();
    force.charge(currentCharge * 0.7).start();
};

var fixStartEndNodes = function() {

};
