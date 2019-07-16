
import {
  MaterialCreator
} from './MTLLoader';
import { LoadingManager } from '../../../loaders/LoadingManager';
import { Group } from '../../../objects/Group';

export class OBJLoader {
  constructor(manager?: LoadingManager);
  manager: LoadingManager;
  materials: MaterialCreator;
  path: string;

  load(url: string, onLoad: (group: Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  parse(data: string): Group;
  setPath(value: string): this;
  setMaterials(materials: MaterialCreator): this;
}
