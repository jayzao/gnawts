
function runSideviewSanityChecks() {
    var REQUIRED_VERSION = "1.3.5";
    function isAppLoaded() {
        var appList = false;
        try {appList = Splunk.Module.loadParams.AccountBar_0_0_0.appList;}
        catch(e) {}
        if (!appList) return -1;
        for (var i=0,len=appList.length;i<len;i++) {
            if (appList[i].id == "sideview_utils") return 1;
        }
        return 0;
    }
    function isModulePresent() {
        return ($("div.SideviewUtils").length>0);
    }
    // only show the most pressing error at a time.
    if (isAppLoaded()==0)        $("#SideviewAppNotInstalled").show();
    else if (!isModulePresent()) $("#SideviewModuleNotPresent").show();
    else if (REQUIRED_VERSION && typeof(Sideview)!="undefined") {
        var currentVersion,
            allIsWell = false;
        if (Sideview.utils.hasOwnProperty("checkRequiredVersion")) {
            currentVersion = Sideview.utils.getCurrentVersion();
            allIsWell = Sideview.utils.checkRequiredVersion(REQUIRED_VERSION);
        }
        if (!allIsWell){
            currentVersion = currentVersion || "1.0.5.2 or older";
            $("#SideviewModuleVersionTooOld .currentVersion").text(currentVersion);
            $("#SideviewModuleVersionTooOld .requiredVersion").text(REQUIRED_VERSION);
            $("#SideviewModuleVersionTooOld").show();
        }
    }
}

function runDataSanityCheck() {
    Sideview.utils.forEachModuleWithCustomBehavior("checkDataForProblems", function(i,behaviorModule) {
        behaviorModule.onJobDone = function() {
            var context = this.getContext()
            var job = context.get("search").job;
            var hasEvents = (job.getEventCount() > 0);
            var allEventsHaveFields = (job.getResultCount()==0);

            // only show the most pressing error at a time.
            if (!hasEvents) {
                $("#noDataIndexed").show();
            } else if (!allEventsHaveFields) {
                $("#notAllFieldsExtracted").show();
            } 
        }.bind(behaviorModule);
    });
}
runSideviewSanityChecks();
if (typeof(Sideview)!="undefined") {

    $(document).bind("allModulesInHierarchy", function() {
        window.setTimeout(function(){
            runDataSanityCheck();
        },0);
    });
        


    if (Splunk.util.getCurrentView() == "articles") {
        if (Splunk.Module.SimpleResultsTable) {
            Splunk.Module.SimpleResultsTable = $.klass(Splunk.Module.SimpleResultsTable, {
                renderResults: function($super, htmlFragment) {
                    $super(htmlFragment);
                    $("tr th:first", this.container).addClass("invisible");
                    $("tr", this.container).each(function(i) {
                        $("td:first", $(this)).addClass("invisible");
                    });
                }
            });
        }
    }
}


//Chama Rack View:  tags the inlet temperatures and adds css class name
if (Splunk.util.getCurrentView() == "Chama_Heat_Map" ) {
    if (Splunk.Module.SimpleResultsTable) {
        Splunk.Module.SimpleResultsTable = $.klass(Splunk.Module.SimpleResultsTable, {
            forEachCellInColumn: function(callback) {
		var container = this.container;
              	container.find('tr:not(.header)').each(function() {
                    // does not support colspans.
                    var columnIndex = $(this).parent().children().index($(this));

                    container.find("td:nth-child(" + (columnIndex+2)  + ")").each(function() {
        		callback($(this));
                    });
		});
            },
            onResultsRendered: function() {
                this.forEachCellInColumn(function(tdElement) {
                    if (tdElement.text() < 27) {
			tdElement.addClass("Normal");
                    } else if(tdElement.text() >=27 && tdElement.text()<=29){
                        tdElement.addClass("NormalHigh"); 
		    } else if(tdElement.text() >=30 && tdElement.text()<=33){
		        tdElement.addClass("Warning");
		    }
		    else{
                        tdElement.addClass("Critical");
                    }  
        	});


            }
	});
    }
}

