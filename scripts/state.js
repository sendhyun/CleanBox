// state.js

const STORAGE_KEY = "cleanbox-data";

const initialState = { projects: {} };

// 상태 불러오기
export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(initialState));
    } catch (e) {
        console.warn("CleanBox: state load failed, resetting.", e);
        return JSON.parse(JSON.stringify(initialState));
    }
}

// 상태 저장
export function saveState(nextState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

// 전역 상태 (참조 유지)
export let state = loadState();

// 상태 업데이트 유틸
export function updateState(mutator) {
    mutator(state);
    saveState(state);
}

// 모든 프로젝트 반환
export function getProjects() {
    return state.projects;
}

// 단일 프로젝트 반환
export function getProject(projectName) {
    return state.projects[projectName];
}

// 프로젝트의 모든 파일 반환
export function getProjectFiles(projectName) {
    return state.projects[projectName]?.files || [];
}
