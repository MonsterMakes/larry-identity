'use strict';

class PromiseUtils {
	static serial(originalIterable, promiseReducer) {
		let attempted = {};
		let attemptedCount = 0;
		let proms = [];
		let completedPromises = [];
		let allPromise = originalIterable.reduce(
			(allProm, resolveItOrNot, currentIndex) => {
				let result = promiseReducer(allProm, resolveItOrNot, currentIndex);
				if (result) {
					attemptedCount++;
					attempted[currentIndex] = true;
					allProm.then(() => {
						proms.push(result);
					}, () => {
					});
					result.then(() => {
						completedPromises.push(result);
					}, () => {
					});
					return result;
				}
				else {
					attempted[currentIndex] = false;
					return allProm;
				}
			},
			Promise.resolve()
		);

		return allPromise
			.then(() => {
				return Promise.resolve({
					completedPromises: completedPromises,
					completedCount: completedPromises.length,
					attemptedCount: attemptedCount,
					attemptedByIndex: attempted
				});
			})
			.catch((e) => {
				let failedIndex = proms.length - 1;
				let failedIterable = originalIterable[failedIndex];
				return Promise.reject({
					failure: e,
					failedIndex: failedIndex,
					failedIterable: failedIterable,
					completedPromises: completedPromises,
					completedCount: completedPromises.length,
					attemptedCount: attemptedCount,
					attemptedByIndex: attempted
				});
			});
	}
}
module.exports = PromiseUtils;