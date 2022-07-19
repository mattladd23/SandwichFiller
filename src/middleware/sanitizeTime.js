const sanitizeTime = (results, deadline, updated) => {
    for (let i = 0; i < results.length; i++) {
        let deadlineResult = results[i][deadline];
        deadlineResult = deadlineResult.toString();
        deadlineResult = deadlineResult.split('T');
        results[i][deadline] = deadlineResult[0];

        let updatedResult = results[i][updated];
        updatedResult = updatedResult.toString();
        updatedResult = updatedResult.split('T');
        results[i][updated] = updatedResult[0];
    }
    return results;
};

module.exports = sanitizeTime;