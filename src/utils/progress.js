export function getTopicState(topicsState, topicId) {
	return topicsState[String(topicId)] || { readingsComplete: [], notes: '', lastModified: 0 };
}

export function calculateTopicCompletion(topic, topicsState) {
	const state = getTopicState(topicsState, topic.id);
	const total = topic.readings.length;
	const completedSet = new Set(state.readingsComplete || []);
	let completed = 0;
	for (let i = 0; i < total; i += 1) {
		if (completedSet.has(i)) completed += 1;
	}
	const isComplete = total > 0 && completed === total;
	const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
	return { completed, total, percent, isComplete };
}

export function calculateOverallProgress(examTopics, topicsState) {
	let topicsComplete = 0;
	for (const topic of examTopics) {
		const { isComplete } = calculateTopicCompletion(topic, topicsState);
		if (isComplete) topicsComplete += 1;
	}
	const totalTopics = examTopics.length;
	const percent = totalTopics === 0 ? 0 : Math.round((topicsComplete / totalTopics) * 100);
	return { topicsComplete, totalTopics, percent };
}


