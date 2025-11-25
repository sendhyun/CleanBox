// project.js

import { state, saveState } from "./state.js";

// 새 프로젝트 생성
export function createProject(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return false;

    if (state.projects[trimmed]) {
        alert("이미 존재하는 프로젝트입니다!");
        return false;
    }

    state.projects[trimmed] = {
        name: trimmed,
        files: []
    };

    saveState(state);
    return true;
}

// 프로젝트 이름 목록 반환
export function getProjectNames() {
    return Object.keys(state.projects);
}

export function projectExists(name) {
    return Boolean(state.projects[name]);
}

export function renameProject(oldName, newName) {
    const from = (oldName || "").trim();
    const to = (newName || "").trim();
    if (!from || !to) return false;
    if (!state.projects[from]) return false;
    if (state.projects[to]) {
        alert("이미 존재하는 프로젝트 이름입니다.");
        return false;
    }
    const data = { ...state.projects[from], name: to };
    delete state.projects[from];
    state.projects[to] = data;
    saveState(state);
    return true;
}

export function deleteProject(name) {
    const key = (name || "").trim();
    if (!key || !state.projects[key]) return false;
    delete state.projects[key];
    saveState(state);
    return true;
}
