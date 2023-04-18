var getScriptPromisify = (src) => {
    return new Promise((resolve) => {
      $.getScript(src, resolve);
    });
  };

//d3-sankey SAC custom widget Version 1.0.0. 
(function () {
let developMode = true; //AM developer flag
const prepared = document.createElement("template");
prepared.innerHTML = `
    <style>
    .linkDefault {
    fill: none;
    stroke: #000;
    stroke-opacity: .2;
    }
    .linkUnselected {
    stroke-opacity: .5;
    }
    .linkDefaultHover {
    fill: none;
    stroke: #000;
    stroke-opacity: .2;
    }
    .linkUnselectedHover {
    stroke-opacity: .5;
    }
    </style>
    <div>
    <div id="root" style="width: 100%; height: 100%;">
    </div>
`;

class SANKEY extends HTMLElement {
    constructor() {
        super();

        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(prepared.content.cloneNode(true));
  
        this._root = this._shadowRoot.getElementById("root");
  
        this._props = {};
  
        this.render();
    }

    onCustomWidgetResize(width, height) {
        this.render();
    }

    set myDataSource(dataBinding) {
        this._myDataSource = dataBinding;
        this.render();
    }

    async render(){ 
        await getScriptPromisify("https://d3js.org/d3.v5.js");
        await getScriptPromisify("https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/LIB/sankey.js");
        
        if (!this._myDataSource || this._myDataSource.state !== "success") {
            return;
        }
    
        const dimension = this._myDataSource.metadata.feeds.dimensions.values[0];
        const source = this._myDataSource.metadata.feeds.dimensions.values[0];
        const target = this._myDataSource.metadata.feeds.dimensions.values[1];
        const measure = this._myDataSource.metadata.feeds.measures.values[0];

        var data = { nodes:[], links:[]};
        var nodes_source = this._myDataSource.data.map((data) => {
            return {
                    node: data[source].id,
                    name: data[source].id
                };
            });
        var nodes_target = this._myDataSource.data.map((data) => {
            return {
                    node: data[target].id,
                    name: data[target].id
                };
            });
        nodes_source = nodes_source.filter(
            (n, index) => index === nodes_source.findIndex(
            other => n.node === other.node
            && n.name === other.name
        ));        
        nodes_target = nodes_target.filter(
            (n, index) => index === nodes_target.findIndex(
            other => n.node === other.node
            && n.name === other.name
        ));
        
        data.nodes = nodes_source.concat(nodes_target);
        data.links = this._myDataSource.data.map((data) => {
            return {
                    source: data[source].id,
                    target: data[target].id,
                    value: data[measure].raw,
            };
            });
        
        
        this.drawChart(data, this._props);
    }

    drawChart(value, config) {
        //config.valDecimal = config.valDecimal + "";
        var r = this.shadowRoot;
        var _div = r.querySelector('div');
        _div.style.width = this.$width - 10;
        _div.style.height = this.$height;
        _div.innerHTML = '';
        let table = _div.appendChild(document.createElement("table"));
        table.setAttribute("class", "rootTable");
        table.setAttribute("cellspacing", "0");
        table.setAttribute("cellpadding", "0");
        table.setAttribute("border", "0");
        let tbody = table.appendChild(document.createElement("tbody"));
        let tabrow = tbody.appendChild(document.createElement("tr"));
        let chartRoot = tabrow.appendChild(document.createElement("td"));
        let buttonRoot = tabrow.appendChild(document.createElement("td"));
        let legendRoot = tabrow.appendChild(document.createElement("td"));
        var container = chartRoot.appendChild(document.createElement("div"));
        container.setAttribute("id", "chartContainer");
        container.setAttribute("class", "chartContainer");
        var button = buttonRoot.appendChild(document.createElement("button"));
        button.setAttribute("id", "button");
        button.setAttribute("class", "button");
        button.innerHTML = '«';
        var legend = legendRoot.appendChild(document.createElement("div"));
        legendRoot.setAttribute("id", "legendContainer");
        legendRoot.setAttribute("class", "legendContainerHidden");
        var fbchart = this.drawSankey(value, config, this.shadowRoot, this);
    }

    d3SankeyDefaultSettings() {
        return {
            leftMargin: 10,
            topMargin: 10,
            rightMargin: 10,
            bottomMargin: 10,
            legendMargin: 50,
            title: 'Custom Sankey Widget',
            showTitle: true,
            showAvg: true,
            showSearch: true,
            startColor: "#ffcd00",
            endColor: "#b01c02",
            sizeDecimal: 2,
            colorDecimal: 2,
            valDecimal: 2,
            xAxisLabel: "Value",
            sizeLabel: "Size",
            colorLabel: "Color",
            selectedLinkLabel: undefined,
            selectedLinkSource: undefined,
            selectedLinkTarget: undefined,
            selectedColorValue: undefined,
            data: [],
            defaultChartBodyHeight: 1200,
            defaultChartBodyWidth: 1600
        };
    }

    drawSankey(data, config, root, eventDispatcher) {
        console.log(data);
        var container = d3.select(root.querySelector('#chartContainer'));
        if (config.title == null)
            config = this.d3SankeyDefaultSettings();
        try {
            //config.data = JSON.parse(dataJSON);
            config.data = data;
        } catch (e) {
            container.append('div').attr('class', 'noData').append('p').text('No data to display.');
            d3.select(root.querySelector('#button')).style('display', 'none');
            d3.select(root.querySelector('#legendContainer')).style('display', 'none');
            return this;
        }
        if (data == '' || data == '""' || data == "''" || data == '[]' || data == '{}' || data == null || data == undefined) {
            container.append('div').attr('class', 'noData').append('p').text('No data to display.');
            d3.select(root.querySelector('#button')).style('display', 'none');
            d3.select(root.querySelector('#legendContainer')).style('display', 'none');
            return this;
        }
        if(!developMode)
        config.data = _.filter(config.data, function (d) {
                return d.from != null && d.to != null && d.value != null && d.id != undefined && d.from != undefined && d.to != undefined;
            });
        if (config.data.length == 0) {
            container.append('div').attr('class', 'noData').append('p').text('No data to display.');
            d3.select(root.querySelector('#button')).style('display', 'none');
            d3.select(root.querySelector('#legendContainer')).style('display', 'none');
            return this;
        }
        d3.select(root.querySelector('#button')).on('click', function (d) {
            var arrow = root.querySelector('#button').innerHTML;
            if (arrow == '«') {
                root.querySelector('#button').innerHTML = '»';
                d3.select(root.querySelector('#legendContainer')).attr('class', 'legendContainer');
            } else {
                root.querySelector('#button').innerHTML = '«';
                d3.select(root.querySelector('#legendContainer')).attr('class', 'legendContainerHidden');
            }
        });
		
        var topBar = undefined;
        if (config.showTitle || config.showSearch) {
            topBar = container.append('div').attr('class', 'topBar').append('table').append('tr');
            topBar.append('td').append('div').attr('id', 'titleContainer');
            topBar.append('td').append('div').attr('id', 'searchContainer');
        }
        if (config.showSearch) {
            var searchcontainer = root.querySelector('#searchContainer');
            d3.select(searchcontainer).append('input').attr('id', 'searchfield').attr('type', 'search').attr("class", 'searchBar').attr("placeholder", "Search").on("keyup", function () {
                var f = root.querySelector('#searchfield');
                var q = f.value;
                highlightLinks(q.toUpperCase());
            }).on("search", function () {
                var f = root.querySelector('#searchfield');
                var q = f.value;
                highlightLinks(q.toUpperCase());
            });
        }
        if (config.showTitle) {
            var vis_t = root.querySelector('#titleContainer');
            d3.select(vis_t).append('text').text(config.title).attr('x', 0).attr('y', 0).attr("dy", "12px").attr("class", 'title');
        }

        var vis = container.append('div')
                            .attr('class', 'chartBody')
                            .style('height', (config.showTitle || config.showSearch) ? Math.max((container.style('height')
                                        .replace("px", "") - 30), config.defaultChartBodyHeight) + 'px' : container.style('height'))
                            .style('width', (config.showTitle || config.showSearch) ? Math.max((container.style('width')
                                        .replace("px", "") - 30), config.defaultChartBodyWidth) + 'px' : container.style('width'))
                            .append("svg:svg").attr("id", 'svgContent').attr("width", "100%").attr("height", "100%");
        var width = vis.style("width").replace("px", "");
        var height = vis.style("height").replace("px", "");
        var w = width - config.leftMargin - config.rightMargin - 50,
        h = height - config.topMargin - config.bottomMargin;
        var formatSizeValue = d3.format(",." + config.sizeDecimal + "f"),
        formatColorValue = d3.format(",." + config.colorDecimal + "f"),
        formatValue = d3.format(",." + config.valDecimal + "f");
        var colorScale = [];
        colorScale.push(config.startColor);
        colorScale.push(config.endColor);

        var nodes = config.data.nodes;
        var links = config.data.links;

        if(!developMode){
            var min_x = _.minBy(nodes, function (d) {
                    return d.xvalue;
                }).xvalue;
            var max_x = _.maxBy(nodes, function (d) {
                    return d.xvalue;
                }).xvalue;
            var mean_x = _.meanBy(nodes, function (d) {
                    return d.xvalue;
                });
            var min_c = _.minBy(nodes, function (d) {
                    return d.color;
                }).color;
            var max_c = _.maxBy(nodes, function (d) {
                    return d.color;
                }).color;
            var min_s = _.minBy(nodes, function (d) {
                    return d.size;
                }).size;
            var max_s = _.maxBy(nodes, function (d) {
                    return d.size;
                }).size;
        
            var xScale = d3.scaleLinear().domain([min_x, max_x]).range([25, w - 25]);
            var cScale = d3.scaleLinear().domain([min_c, max_c]).range(colorScale);
            var zScale = d3.scaleLinear().domain([min_s, max_s]).range([5, 25]);
        }

        // Set the sankey diagram properties
        var sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(1)
            .size([width, height]);

        // loop through each link replacing the text with its index from node
        links.forEach(function (d, i) {
            //links[i].source = nodes.indexOf(links[i].source);
            links[i].source = nodes.map(e => e.name).indexOf(links[i].source);
            //links[i].target = nodes.indexOf(links[i].target);
            links[i].target = nodes.map(e => e.name).indexOf(links[i].target);
        });
        
        sankey
            .nodes(nodes)
            .links(links)
            .layout(1);
            
        var link = vis.append("g")
        .selectAll(".link")
        .data(links)
        .enter()
        .append("path")
          .attr("class", "linkDefault")
          .attr("id", function(d) { return getLinkId(d);})
          .attr("d", sankey.link() )
          .style("stroke-width", function(d) { return Math.max(1, d.dy); })
          .sort(function(a, b) { return b.dy - a.dy; })
          .on("mouseout", function (d, i) {
                var c = root.querySelector('#link_' + d.source.node + "_" + d.target.node).getAttribute('class');
                if (c == 'linkDefaultHover') {
                    root.querySelector('#link_' + d.source.node + "_" + d.target.node).setAttribute("class", 'linkDefault');
                } else if (c == 'linkUnselectedHover') {
                    root.querySelector('#link_' + d.source.node + "_" + d.target.node).setAttribute("class", 'linkUnselected');
                }
            }).on("mouseover", function (d, i) {
                var c = root.querySelector('#link_' + d.source.node + "_" + d.target.node).getAttribute('class');
                if (c == 'linkDefault') {
                    root.querySelector('#link_' + d.source.node + "_" + d.target.node).setAttribute("class", 'linkDefaultHover');
                } else if (c == 'linkUnselected') {
                    root.querySelector('#link_' + d.source.node + "_" + d.target.node).setAttribute("class", 'linkUnselectedHover');
                }
            })
          .on("click", function (d, i) {
            if (config.selectedLinkLabel == d.id & d.id != null) {
                config.selectedLinkLabel = undefined;
                config.selectedLinkSource = undefined;
                config.selectedLinkTarget = undefined;
            } else {
                config.selectedLinkLabel = getLinkId(d);
                config.selectedLinkSource = d.source.node;
                config.selectedLinkTarget = d.target.node;
            }
            eventDispatcher.dispatchEvent(new CustomEvent("propertiesChanged", {
                    detail: {
                        properties: {
                            selectedLinkLabel: config.selectedLinkLabel,
                            selectedLinkSource: config.selectedLinkSource,
                            selectedLinkTarget: config.selectedLinkTarget,
                        }
                    }
                }));
            var event = new Event("onSelect");
            eventDispatcher.dispatchEvent(event);
            if(developMode) console.log(getLinkId(d));
        })
          ;

        var node = vis.append("g")
        .selectAll(".node")
        .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("id", function(d) { return d.name; })
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
          .call(d3.drag()
            .subject(function(d) { return d; })
            .on("start", function() { this.parentNode.appendChild(this); })
            .on("drag", dragmove));

        // add the rectangles for the nodes
        node
        .append("rect")
          .attr("height", function(d) { return d.dy; })
          .attr("width", sankey.nodeWidth())
          //.style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
          .style("fill", function(d) { return d.color = d3.color("steelblue"); })
          .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
        // Add hover text
        .append("title")
          .text(function(d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });

        // add in the title for the nodes
        node
          .append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");
            
        // the function for moving the nodes
        function dragmove(d) {
            d3.select(this)
              .attr("transform",
                    "translate("
                       + d.x + ","
                       + (d.y = Math.max(
                          0, Math.min(height - d.dy, d3.event.y))
                         ) + ")");
            sankey.relayout();
            link.attr("d", sankey.link() );
        }
        
        function addTooltip() {
            for (var it = 0; it < nodes.length; it++) {
                var b = root.querySelector("#node_" + it);
                var tooltip = document.createElementNS("http://www.w3.org/2000/svg", "title");
                tooltip.innerHTML = nodes[it].name + '\n' + config.xAxisLabel + ': ' + formatValue(nodes[it].xvalue) + '\n' + config.sizeLabel + ': ' + formatSizeValue(nodes[it].size) + '\n' + config.colorLabel + ': ' + formatColorValue(nodes[it].color);
                if (b.firstChild != null)
                    b.removeChild(b.firstChild);
                b.appendChild(tooltip);
            }
        }
        
        function highlightLinks(_query) {
            if (_query.length == 0) {
                nodes.forEach(function (d, i) {
                    root.querySelector('#link_' + i).setAttribute('class', 'linkDefault');
                });
            } else {
                nodes.forEach(function (d, i) {
                    var content = _.toUpper(d.name);
                    if (content.indexOf(_query) > -1) {
                        root.querySelector('#link_' + i).setAttribute('class', 'linkDefault');
                    } else {
                        root.querySelector('#link_' + i).setAttribute('class', 'linkUnselected');
                    }
                });
            }
        }

        function getLinkId(d){
            return "link_" + d.source.node + "_" + d.target.node;
        }
        return this;
    }
}
customElements.define("ai-estilos-amontagna-demo-sankey", SANKEY);
})();
