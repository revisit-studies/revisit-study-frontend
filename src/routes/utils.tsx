import { useNavigate, useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { ModuleNamespace } from 'vite/types/hot';
import {
  useFlatSequence, useStoreActions, useStoreDispatch, useStoreSelector,
} from '../store/store';
import { decryptIndex, encryptIndex } from '../utils/encryptDecryptIndex';
import { JumpFunctionParameters, JumpFunctionReturnVal } from '../store/types';
import { findFuncBlock } from '../utils/getSequenceFlatMap';
import { useStudyConfig } from '../store/hooks/useStudyConfig';
import { getComponent } from '../utils/handleComponentInheritance';

export function useStudyId(): string {
  const { studyId } = useParams();

  return `${studyId}`;
}

export function useCurrentStep() {
  const { index } = useParams();
  if (index === undefined) {
    return 0;
  }

  if (index.startsWith('reviewer-') || index.startsWith('__')) {
    return index;
  }

  return decryptIndex(index);
}

const modules = import.meta.glob(
  '../public/**/*.{mjs,js,mts,ts,jsx,tsx}',
  { eager: true },
);

export function useCurrentComponent(): string {
  const { funcIndex } = useParams();
  const _answers = useStoreSelector((state) => state.answers);
  const studyConfig = useStudyConfig();
  const currentStep = useCurrentStep();
  const flatSequence = useFlatSequence();
  const navigate = useNavigate();
  const studyId = useStudyId();
  const storeDispatch = useStoreDispatch();
  const { pushToFuncSequence, setFuncParams } = useStoreActions();

  const [prevComponentName, setPrevComponentName] = useState<string>('');

  const currentComponent = useMemo(() => (typeof currentStep === 'number' ? getComponent(flatSequence[currentStep], studyConfig) : null), [currentStep, flatSequence, studyConfig]);

  const nextFunc:(({ components, answers, sequenceSoFar }: JumpFunctionParameters) => JumpFunctionReturnVal) | null = useMemo(() => {
    if (typeof currentStep === 'number' && !currentComponent) {
      const block = findFuncBlock(flatSequence[currentStep], studyConfig.sequence);

      if (!block) {
        return null;
      }

      const reactPath = `../public/${block.func}`;
      const newFunc = reactPath in modules ? (modules[reactPath] as ModuleNamespace).default : null;

      return newFunc;
    }
    return null;
  }, [currentComponent, currentStep, flatSequence, studyConfig.sequence]);

  useEffect(() => {
    if (!funcIndex && nextFunc && typeof currentStep === 'number') {
      navigate(`/${studyId}/${encryptIndex(currentStep)}/${encryptIndex(0)}${window.location.search}`);
    }
  }, [currentStep, funcIndex, navigate, nextFunc, studyId]);

  const { compName, parameters } = useMemo(() => {
    if (typeof currentStep === 'number') {
      const component = getComponent(flatSequence[currentStep], studyConfig);

      // in a func component
      if (!component && nextFunc !== null) {
        const { component: currCompName, parameters: _params } = nextFunc({
          components: [], answers: _answers, sequenceSoFar: [], customParameters: {},
        });
        if (currCompName !== null) {
          return { compName: currCompName, parameters: _params };
        }

        return { compName: prevComponentName, parameters: null };
      }
      return { compName: flatSequence[currentStep], parameters: null };
    }
    return { compName: currentStep.replace('reviewer-', ''), parameters: null };
  }, [_answers, currentStep, flatSequence, nextFunc, prevComponentName, studyConfig]);

  useEffect(() => {
    if (typeof currentStep !== 'number') {
      return;
    }
    if (compName === null) {
      navigate(`/${studyId}/${encryptIndex(currentStep + 1)}${window.location.search}`);
    } else if (flatSequence[currentStep] !== compName) {
      if (funcIndex) {
        storeDispatch(pushToFuncSequence({
          component: compName, funcName: flatSequence[currentStep], index: currentStep, funcIndex: decryptIndex(funcIndex),
        }));
      }
      storeDispatch(setFuncParams(parameters));
    }
    setPrevComponentName(compName);
  }, [compName, currentStep, flatSequence, funcIndex, navigate, parameters, pushToFuncSequence, setFuncParams, storeDispatch, studyId]);
  // console.log(compName, nextFunc, currentComponent, flatSequence);

  return compName;
}
