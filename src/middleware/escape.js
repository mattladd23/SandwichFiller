// String escape
const stringEscape = (input) => {
    input = input.split('');
    input.forEach((character, index) => {
        if (character === "'") {
            input[index] = "''";
        }
    });
    return input.join('');
};

// HTML escape
const htmlEscape = (input) => {
    input = input.toString();
    input.replace(
        /[^0-9A-Za-z]/g,
        c => "&#" + c.charCodeAt(0) + ";"
    )
    return input;
}

// HTML escape for query results
// Results represent table results
// Features represent arrays of table column strings
// Ignore represents arrays or column strings to be ignored and passed through the htmlEscape function
const resultsHtmlEscape = (results, features, ignore) => {
    for (let i = 0; i < results.length; i++) {
        features.forEach(feature => {
            ignore.forEach(ignored => {
                if (feature !== ignored) {
                    results[i][feature] = htmlEscape(results[i][feature]);
                }
            });
        });
    }
    return results;
};

module.exports = {
    stringEscape: stringEscape,
    htmlEscape: htmlEscape,
    resultsHtmlEscape: resultsHtmlEscape
};