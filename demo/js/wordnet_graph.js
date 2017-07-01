/* 
    Kevin Yang 
    Cal Poly SLO
    CSC 400 with Professor Lubomir Stanchev
    3/14/2017

    wordnet_graph.js
    JavaScript code for the WordNet graph using the Cytoscope.js library.
*/

$(function(){
    var elementArr = [];
    var graph = JSON.parse(graph_str);
    var originHistory = {}

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function generateNodeRGB(sense, src) {
        var rgb = [];

        if (sense == src) {
            for(var i = 0; i < 3; i++)
                rgb.push(Math.floor(Math.random() * 255));

            return "rgb(" + rgb.join(',') + ")";
        }
        return "rgb(85,85,85)"
    }    

    function getNodeType(sense, src) {
        if (sense == src) {
            return 1.0 // origin
        }
        else {
            return 0.0 // neighbors
        }
    }

    function addNode(sense, src, match) {
        if (sense && sense.length > 0) {
            if (originHistory.hasOwnProperty(sense) && sense == src) {
                return true; // node exists. Return true.
            }
            elementArr.push(
                {
                    "data":{
                        "id":sense,
                        "name":sense,
                        "nodeType": getNodeType(sense, src),
                        "query":true,
                        "nodeColor": generateNodeRGB(sense, src)
                    },
                    "group":"nodes",
                    "removed":false,
                    "selected":false,
                    "selectable":true,
                    "locked":false,
                    "grabbed":false,
                    "grabbable":true,
                    "classes":""
                }
            );

            originHistory[sense] = elementArr.length - 1; // set hashmap with index in elementArr of node

            if (src != sense) {
                elementArr.push({"data": { "id": sense + src, "source": src, "target": sense, "label" : match}});
            }
        }

        return false // node doesn't exist to. Return false.
    }

    function addRelativeNodes(originSense) {
        var relatedSenses = graph[originSense];
        if (relatedSenses) {
            for (var i = 0; i < relatedSenses.length; i++) {
                addNode(relatedSenses[i][0], originSense, relatedSenses[i][1]);
            }
        }
        return false;
    }

    function createCytoscape(elementArr, nodeStyleArr){
        return cytoscape({
            container: document.getElementById('cy'),
            layout: {
                name: 'spread',
                minDist: 200,
                idealEdgeLength: 300,
                nodeOverlap: 100
            },
            style: nodeStyleArr,
            elements: elementArr
        });
    }

    var nodeStyleArr = [
        {"selector":"core","style":{"selection-box-color":"#AAD8FF","selection-box-border-color":"#8BB0D0","selection-box-opacity":"0.5"}},
        {"selector":"node","style":{
            /* maps nodeType min and max values to min and max width and height values.*/
            "width":"mapData(nodeType, 0.0, 1.0, 40, 80)",
            "height":"mapData(nodeType, 0.0, 1.0, 40, 80)",
            "content":"data(name)","font-size":"12px","text-valign":"center","text-halign":"center","background-color":"data(nodeColor)","text-outline-color":"#555","text-outline-width":"2px","color":"#fff","overlay-padding":"6px","z-index":"10"}},
        {"selector":"node.highlighted","style":{"border-width":"6px","border-color":"#AAD8FF","border-opacity":"0.5","background-color":"#394855","text-outline-color":"#394855","shadow-blur":"12px","shadow-color":"#000","shadow-opacity":"0.8","shadow-offset-x":"0px","shadow-offset-y":"4px"}},
        {"selector":"node[?attr]","style":{"shape":"rectangle","background-color":"#aaa","text-outline-color":"#aaa","width":"16px","height":"16px","font-size":"6px","z-index":"1"}},
        {"selector":"node[?query]","style":{"background-clip":"none","background-fit":"contain"}},
        {"selector":"node:selected","style":{"border-width":"6px","border-color":"#AAD8FF","border-opacity":"0.5","background-color":"#77828C","text-outline-color":"#77828C"}},
        {"selector":"node.unhighlighted","style":{"opacity":"0.2"}},
        
        {"selector":"edge","style":{"color":"#888", "label": "data(label)", "curve-style":"haystack","haystack-radius":"0.5","line-color":"#bbb","width":"mapData(weight, 0, 1, 1, 8)","overlay-padding":"3px"}},
        {"selector":"edge.unhighlighted","style":{"opacity":"0.05"}},
        {"selector":".highlighted","style":{"z-index":"999999"}},
        {"selector":"edge.filtered","style":{"opacity":"0"}}
    ];

    function recurseNodes(that) {
        that.neighborhood('edge').style( { 'line-color' : 'red' }); // change the colors per origin click.
        //addNode(this.id(), this.id(), 0);
        that.data("nodeColor", generateNodeRGB("", ""));
        addRelativeNodes(that.id());
        cy = window.cy = createCytoscape(elementArr, nodeStyleArr);
        console.log(cy.getElementById(that.id()).id());
        cy.fit(cy.getElementById(that.id()), 100);
        cy.nodes().on("click", function(){recurseNodes(this);});
    }

    $('#senseSubmit').on("click", function() {
        var inputs = $('#senseForm :input');

        if (inputs[0].value == null) {
            console.log("Word or Sense cannot be empty or null!");
            return false;
        }

        var nodeExists = addNode(inputs[0].value, inputs[0].value, 0); // add origin node.
        addRelativeNodes(inputs[0].value); // add neighboring nodes.

        var cy = window.cy = createCytoscape(elementArr, nodeStyleArr);
        //cy.add(elementArr);
        // If we pick an origin that wasn't an origin before, set it's style as an origin.
        if (nodeExists) {
            var node = cy.getElementById(inputs[0].value);
            node.data("nodeColor", generateNodeRGB("", "")); // empty strings to make sure equality of origin.
            node.data("nodeType", getNodeType("", "")); // empty strings to make sure equality of origin.
        }

        cy.nodes().on("click", function(){
            recurseNodes(this);
        });
        return false;
    });

    $("#graphReset").on("click", function(){
        cy.elements().remove();
        elementArr = [];
        originHistory = {};
    });

    $("#fitWindow").on("click", function(){
        cy.fit()
    });

    $("#senseForm").submit(function(e){
        e.preventDefault(e);
        var inputs = $('#senseForm :input');

        if (inputs[0].value == null) {
            console.log("Word or Sense cannot be empty or null!");
            return false;
        }
        if (graph[inputs[0].value]) {
            addNode(inputs[0].value, inputs[0].value, 0);
            addRelativeNodes(inputs[0].value);

            var cy = window.cy = createCytoscape(elementArr, nodeStyleArr);

            //cy.add(elementArr);
            cy.nodes().on("click", function(){
                recurseNodes(this);
            });
        }
        else {
            alert("word or sense doesn't exist in graph!");
        }
        return false;
    });
});