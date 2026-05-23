export type MissionType = "Story" | "Side" | "Base";
export type StageType = "Dialogue" | "Pickup" | "Drop";

export interface DialogueLine {
	id: string;
	speakerId: string;
	text: string;
}

export interface MissionStage {
	id: string;
	stageType: StageType;
	targetBuildingId: string | null;
	statusMessage: string;
	dialogues: DialogueLine[];
	cargoWeight: number;
	timeLimit: number;
	audioComplete: boolean;
}

export interface Mission {
	id: string;
	missionName: string;
	description: string;
	missionType: MissionType;
	prerequisites: string[];
	stages: MissionStage[];
	positionX: number;
	positionY: number;
}

export interface Character {
	id: string;
	name: string;
	nickname: string;
	age: number;
	gender: string;
	occupation: string;
	description: string;
}

export interface Building {
	id: string;
	buildingName: string;
}

export interface MissionEdge {
	id: string;
	source: string; // mission id
	target: string; // mission id
}

export interface GraphData {
	missions: Mission[];
	edges: MissionEdge[];
}
