const STORAGE_KEY = 'nvdaStudyTracker';

const defaultStore = () => ({
	topics: {},
	lastExport: null,
});

export function loadFromLocalStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultStore();
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return defaultStore();
		if (!parsed.topics || typeof parsed.topics !== 'object') parsed.topics = {};
		return parsed;
	} catch (e) {
		return defaultStore();
	}
}

export function saveToLocalStorage(store) {
	const payload = {
		topics: store.topics || {},
		lastExport: store.lastExport || null,
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch (e) {
		console.warn('LocalStorage save failed:', e);
	}
}

export function clearAllData() {
	localStorage.removeItem(STORAGE_KEY);
}

export function validateImportedData(data) {
	if (!data || typeof data !== 'object') return false;
	if (!('topics' in data)) return false;
	if (typeof data.topics !== 'object' || Array.isArray(data.topics)) return false;
	for (const [topicId, topicState] of Object.entries(data.topics)) {
		if (!topicState || typeof topicState !== 'object') return false;
		if (!('readingsComplete' in topicState) || !Array.isArray(topicState.readingsComplete)) return false;
		if (!('notes' in topicState) || typeof topicState.notes !== 'string') return false;
		if (!('lastModified' in topicState)) return false;
	}
	return true;
}

export function buildEmptyTopicState() {
	return { readingsComplete: [], notes: '', lastModified: Date.now() };
}

export function exportData(store) {
	const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	return url;
}


