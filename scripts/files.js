// files.js

import { state, updateState, getProjectFiles, getProject, getProjects } from "./state.js";

function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `file-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function normalizeTags(rawTags = []) {
    const unique = new Set();
    rawTags.forEach(t => {
        const v = (t || "").trim();
        if (v) unique.add(v);
    });
    return Array.from(unique);
}

// 파일 업로드 (자동 확장자 태그)
export async function addFiles(projectName, files) {
    const project = getProject(projectName);
    if (!project) return [];

    const list = Array.from(files || []);
    const newFiles = [];

    for (const file of list) {
        const dataUrl = await readFileAsDataUrl(file);
        const ext = (file.name.split(".").pop() || "file").toLowerCase();

        const entry = {
            id: generateId(),
            name: file.name,
            dataUrl,
            tags: normalizeTags([ext]),
            createdAt: new Date().toISOString()
        };

        newFiles.push(entry);
    }

    if (newFiles.length) {
        updateState(s => {
            project.files.push(...newFiles);
        });
    }

    return newFiles;
}

export function deleteFile(projectName, fileId) {
    const project = getProject(projectName);
    if (!project) return;

    const idx = project.files.findIndex(f => f.id === fileId);
    if (idx >= 0) {
        updateState(() => {
            project.files.splice(idx, 1);
        });
    }
}

export function renameFile(projectName, fileId, newName) {
    const project = getProject(projectName);
    if (!project) return;
    const target = project.files.find(f => f.id === fileId);
    if (!target) return;

    const name = (newName || "").trim();
    if (!name) return;

    updateState(() => {
        target.name = name;
    });
}

export function updateTags(projectName, fileId, tags) {
    const project = getProject(projectName);
    if (!project) return;
    const target = project.files.find(f => f.id === fileId);
    if (!target) return;

    updateState(() => {
        target.tags = normalizeTags(tags);
    });
}

export function addTag(projectName, fileId, tag) {
    const project = getProject(projectName);
    if (!project) return;
    const target = project.files.find(f => f.id === fileId);
    if (!target) return;

    const tags = normalizeTags([...target.tags, tag]);
    updateTags(projectName, fileId, tags);
}

export function removeTag(projectName, fileId, tag) {
    const project = getProject(projectName);
    if (!project) return;
    const target = project.files.find(f => f.id === fileId);
    if (!target) return;

    const tags = target.tags.filter(t => t !== tag);
    updateTags(projectName, fileId, tags);
}

export function getFileById(projectName, fileId) {
    const project = getProject(projectName);
    if (!project) return null;
    return project.files.find(f => f.id === fileId) || null;
}

// 검색 + 정렬 파이프라인
export function getFilteredSortedFiles(projectName, searchValue = "", sortMode = "createdAt") {
    const files = getProjectFiles(projectName);
    const tokens = tokenize(searchValue);

    const filtered = tokens.length
        ? files.filter(file => matchTokens(file, tokens))
        : files;

    return sortFiles(filtered, sortMode);
}

export function getAllFiles() {
    const projects = getProjects();
    const results = [];
    Object.entries(projects).forEach(([projectName, project]) => {
        (project.files || []).forEach(file => {
            results.push({ ...file, projectName });
        });
    });
    return results;
}

export function getGlobalSearchResults(searchValue = "", sortMode = "createdAt") {
    const tokens = tokenize(searchValue);
    const files = getAllFiles();
    const filtered = tokens.length
        ? files.filter(file => matchTokens(file, tokens))
        : [];
    return sortFiles(filtered, sortMode);
}

function tokenize(value) {
    return (value || "")
        .split(/\s+/)
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
}

function matchTokens(file, tokens) {
    const name = (file.name || "").toLowerCase();
    const tags = (file.tags || []).map(t => (t || "").toLowerCase());
    return tokens.every(token => {
        if (token.startsWith("#")) {
            const t = token.slice(1);
            return t ? tags.some(tag => tag.includes(t)) : true;
        }
        return name.includes(token) || tags.some(tag => tag.includes(token));
    });
}

function sortFiles(files, sortMode) {
    const sorted = [...files].sort((a, b) => {
        if (sortMode === "name") {
            return a.name.localeCompare(b.name);
        }
        if (sortMode === "tag") {
            const ta = (a.tags && a.tags[0]) || "";
            const tb = (b.tags && b.tags[0]) || "";
            return ta.localeCompare(tb);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
}
