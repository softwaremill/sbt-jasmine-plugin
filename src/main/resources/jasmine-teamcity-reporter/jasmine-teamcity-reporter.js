(function() {

    if (!jasmine) {
        throw new Exception("Jasmine not found in the namespace");
    }

    /*
     * Reporter which reports results of the tests to TeamCity build server
     */
    var TeamCityReporter = function() {

        // escape all characters that TC does not expect in the log file
        var tidy = function tidy(text) {
            var cleanedText = text
                .replace(/\|/g, "||")
                .replace(/'/g, "|'")
                .replace(/\n/g, "|n")
                .replace(/\r/g, "|r")
                .replace(/\u0085/g, "|x")
                .replace(/\u2028/g, "|l")
                .replace(/\u2029/g, "|p")
                .replace(/\[/g, "|[")
                .replace(/\]/g, "|]");

            return cleanedText;
        }

        var jasmineConsole = jasmine.getGlobal().console;

        return {
            reportRunnerStarting: function(runner) {
                jasmineConsole.log("##teamcity[testSuiteStarted name='Jasmine Tests']");
            },

            reportRunnerResults: function(runner) {
                jasmineConsole.log("##teamcity[testSuiteFinished name='Jasmine Tests']");
            },

            reportSuiteResults: function(suite) {  },

            reportSpecStarting: function(spec) {  },
            reportSpecResults: function(spec) {
                var lastIndexOfSeparator = EnvJasmine.specFile.lastIndexOf(EnvJasmine.SEPARATOR)
                var fileName = EnvJasmine.specFile.substring(lastIndexOfSeparator + EnvJasmine.SEPARATOR.length);
                var suiteName = this.getSuiteName(spec.suite);
                var testName = tidy(fileName + ", " + suiteName + ":" + spec.description);

                jasmineConsole.log("##teamcity[testStarted name='" + testName + "']");

                if (spec.results().passed()) {
                    System.out.print(EnvJasmine.green("."));
                    jasmineConsole.log("##teamcity[testPassed " + "name='" + testName + "']");
                } else {
                    var i, result, specResults = spec.results().getItems();
                    var message = "";
                    var messageDelimeter = "";
                    var details = "";
                    var detailsDelimeter = "";

                    for (i = 0; i < specResults.length; i++) {
                        result = specResults[i];
                        if (result.type == 'log') {
                            message = message + messageDelimeter + result.toString();
                            messageDelimeter = "; ";
                        } else if (result.type == 'expect' && result.passed && !result.passed()) {
                            message = message + messageDelimeter + result.toString();
                            messageDelimeter = ", ";
                            if (result.trace.stack) {
                                details = details + detailsDelimeter + specResults[i].trace.stack;
                                detailsDelimeter = "; ";
                            }
                        }
                    }

                    jasmineConsole.log("##teamcity[testFailed " + "name='" + tidy(testName) +
                        "' message='" + tidy(message) +"' details='" + tidy(details) + "']");
                }
                jasmineConsole.log("##teamcity[testFinished name='" + testName + "']");
            },

            log: function(str) {  },

            getSuiteName: function(suite) {
                var suitePath = [];

                while (suite) {
                    suitePath.unshift(suite.description);
                    suite = suite.parentSuite;
                }

                return suitePath.join(' - ');
            }
        };
    }

    // Register TeamCity Reporter in Jasmine registry
    jasmine.getEnv().addReporter(new TeamCityReporter());
})();