import { StorageEngineConstants, StorageEngine } from './StorageEngine';
import localforage from 'localforage';
import { ParticipantData } from '../types';
import { Answer } from '../../parser/types';

export class LocalStorageEngine extends StorageEngine {
  private studyDatabase: LocalForage | undefined = undefined;

  constructor(constants: StorageEngineConstants) {
    super('localStorage', constants);
  }

  async connect() {
    // nothing to do here
  }

  isConnected() {
    return this.studyDatabase !== undefined;
  }

  async initializeStudy(studyId: string, config: object) {
    // Create or retrieve database for study
    this.studyDatabase = await localforage.createInstance({
      name: studyId,
    });
    await this.studyDatabase.setItem('config', config);
    this.connected = true;
  }

  async initializeParticipantSession(participantId: string, sequence: string[]) {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }
    
    // Check if the participant has already been initialized
    const participant: ParticipantData | null = await this.studyDatabase.getItem(participantId);
    if (participant) {
      // Participant already initialized
      this.currentParticipantId = participantId;
      return participant;
    }

    // Initialize participant
    const participantData: ParticipantData = {
      sequence,
      answers: {},
    };
    await this.studyDatabase?.setItem(participantId, participantData);

    // Set current participant id if updated
    await this.studyDatabase.setItem('currentParticipant', participantId);
    this.currentParticipantId = participantId;

    return participantData;
  }

  async getParticipantSession() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    // Get currentParticipantId
    const participantId: string | null = await this.studyDatabase.getItem('currentParticipant');
    this.currentParticipantId = participantId;

    // Get participant data
    let participant: ParticipantData | null = null;
    if (participantId !== null) {
      participant = await this.studyDatabase.getItem(participantId);
    }

    console.log(participantId, participant);

    return participant;
  }

  async finalizeParticipantSession() {
    // TODO: implement
  }

  async getCurrentParticipantId() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    return await this.studyDatabase.getItem('currentParticipant') as string | null;
  }

  async clearCurrentParticipantId() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    await this.studyDatabase.removeItem('currentParticipant');
  }

  async saveAnswer(taskId: string, answer: Answer['answer']) {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    if (!this.currentParticipantId) {
      throw new Error('Participant not initialized');
    }

    // Get participant data
    const participant: ParticipantData | null = await this.studyDatabase.getItem(this.currentParticipantId);
    if (!participant) {
      throw new Error('Participant not initialized');
    }

    // Save answer
    if (!participant.answers[taskId]) {
      participant.answers[taskId] = {
        id: taskId,
        answer: answer,
      };
    }
    participant.answers[taskId].answer = answer;
    await this.studyDatabase.setItem(this.currentParticipantId, participant);
  }

  async setSequenceArray(sequenceArray: string[][]) {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    this.studyDatabase.setItem('sequenceArray', sequenceArray);
  }

  async getSequence() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    // Get the latin square
    const sequenceArray: string[][] | null = await this.studyDatabase.getItem('sequenceArray');
    if (!sequenceArray) {
      throw new Error('Latin square not initialized');
    }

    // Get the current row
    console.log(sequenceArray);
    const currentRow = sequenceArray.pop();
    if (!currentRow) {
      throw new Error('Latin square is empty');
    }

    // Update the latin square
    await this.studyDatabase.setItem('sequenceArray', sequenceArray);
    
    return currentRow;
  }

  async getSequenceArray() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    return await this.studyDatabase.getItem('sequenceArray') as string[][] | null;
  }

  async getAllParticpantsData(studyId: string) {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    const returnArray: ParticipantData[] = [];

    await this.studyDatabase.iterate((value, key) => {
      if (key !== 'config' && key !== 'currentParticipant' && key !== 'sequenceArray') {
        returnArray.push(value as ParticipantData);
      }
    });

    return returnArray;
  }

  async getParticipantData() {
    if (!this._verifyStudyDatabase(this.studyDatabase)) {
      throw new Error('Study database not initialized');
    }

    const participantId = await this.studyDatabase.getItem('currentParticipant') as string | null;
    if (!participantId) {
      return null;
    }

    return await this.studyDatabase.getItem(participantId) as ParticipantData | null;
  }


  private _verifyStudyDatabase(db: LocalForage | undefined): db is LocalForage  {
    return db !== undefined;
  }
}