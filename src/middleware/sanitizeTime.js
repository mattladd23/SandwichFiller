// Time sanitization to remove time and time zone
// const sanitizeTime = (results, deadline, updated) => {
//     for (let i = 0; i < results.length; i++) {
//         let deadlineResult = results[i][deadline];
//         deadlineResult = deadlineResult.toString();
//         deadlineResult = deadlineResult.split('GMT');
//         results[i][deadline] = deadlineResult[0];

//         let updatedResult = results[i][updated];
//         updatedResult = updatedResult.toString();
//         updatedResult = updatedResult.split('GMT');
//         results[i][updated] = updatedResult[0];

//         results = [[results[i][deadline]][results[i][updated]]]
//     }
//     return results;
// };

// // Try with one parameter
// const sanitizeTime = (results, deadline) => {
//     for (let i = 0; i < results.length; i++) {
//         let deadlineResult = results[i][deadline];
//         deadlineResult = deadlineResult.toString();
//         deadlineResult = deadlineResult.split('GMT');
//         results[i][deadline] = deadlineResult[0];
//     }
//     return results;
// };

// module.exports = sanitizeTime;