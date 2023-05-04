import { Button, Group, Text } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useNextTrialId } from '../../controllers/utils';
import {
  ResponseBlockLocation,
  SurveyComponent,
  TrialsComponent,
} from '../../parser/types';
import { useCurrentStep } from '../../routes';
import { useAppDispatch, useStoreActions, useStudySelector } from '../../store';
import {
  updateResponseBlockValidation,
  useAggregateResponses,
  useAreResponsesValid,
  useFlagsDispatch,
} from '../../store/flags';
import { useNextStep } from '../../store/hooks/useNextStep';
import { TrialResult } from '../../store/types';
import { deepCopy } from '../../utils/deepCopy';
import { NextButton } from '../NextButton';
import { useAnswerField } from '../stimuli/inputcomponents/utils';
import ResponseSwitcher from './ResponseSwitcher';

type Props = {
  status: TrialResult | null;
  config: TrialsComponent | SurveyComponent;
  location: ResponseBlockLocation;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  correctAnswer?: any;
};

function useSavedSurvey() {
  const survey = useStudySelector().survey;
  return Object.keys(survey || {}).length > 0 ? survey : null;
}

export default function ResponseBlock({
  config,
  location,
  correctAnswer = null,
  status = null,
}: Props) {
  const { trialId = null, studyId = null } = useParams<{
    trialId: string;
    studyId: string;
  }>();
  const id = useLocation().pathname;

  const isPractice = config.type === 'practice';
  const storedAnswer = status?.answer;

  const responses = config.response.filter(
    (r) =>
      r.location === location
  );

  const isSurvey = config.type === 'survey';
  const savedSurvey = useSavedSurvey();

  const { saveSurvey, saveTrialAnswer } = useStoreActions();
  const appDispatch = useAppDispatch();
  const flagDispatch = useFlagsDispatch();
  const answerValidator = useAnswerField(responses, id);
  const areResponsesValid = useAreResponsesValid(id);
  const aggregateResponses = useAggregateResponses(id);
  const [disableNext, setDisableNext] = useInputState(!storedAnswer);
  const [checkClicked, setCheckClicked] = useState(false);
  const currentStep = useCurrentStep();
  const nextTrialId = useNextTrialId(trialId, config.type);
  const nextStep = useNextStep();

  const showNextBtn =
    location === (config.nextButtonLocation || 'belowStimulus');

  // useEffect(()=>{
  //   console.log(storedAnswer, "stored answer in block")
  //
  // },[storedAnswer])

  useEffect(() => {
    flagDispatch(
      updateResponseBlockValidation({
        location,
        trialId: id,
        status: answerValidator.isValid(),
        answers: deepCopy(answerValidator.values),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerValidator.values]);

  const processNext = useCallback(() => {
    if (config.type === 'survey') {
      const answer = deepCopy(answerValidator.values);

      if (!savedSurvey) appDispatch(saveSurvey(answer));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const answer = deepCopy(aggregateResponses!);

      if (!status?.complete)
        appDispatch(
          saveTrialAnswer({
            trialName: currentStep,
            trialId: trialId || 'NoID',
            answer,
            type: config.type,
          })
        );

    
    }

    setDisableNext(!disableNext);
  }, [
    aggregateResponses,
    answerValidator.values,
    appDispatch,
    savedSurvey,
    config.type,
    currentStep,
    disableNext,
    saveSurvey,
    saveTrialAnswer,
    status,
    setDisableNext,
    trialId,
  ]);

  const decodeIframeAnswer = () => {
    if(!storedAnswer) return [];
    try {
      console.log(storedAnswer, 'answer');
      const AnswerObj = storedAnswer ? JSON.parse(storedAnswer.toString()) : {};
      const AnswerArr = Object.values(AnswerObj)[0];
      return AnswerArr;
    }
    catch(e){
      return [];
    }
  };

  return (
    <>
      {responses.map((response) => (
        <ResponseSwitcher
          key={`${response.id}-${id}`}
          status={isSurvey ? ({ complete: !!savedSurvey } as any) : status}
          storedAnswer={
            isSurvey
              ? savedSurvey
                ? (savedSurvey as any)[`${id}/${response.id}`]
                : null
              : response.type === 'iframe' ? decodeIframeAnswer()
                    :
                storedAnswer
              ? (storedAnswer as any)[`${id}/${response.id}`]
              : null
          }
          answer={{
            ...answerValidator.getInputProps(`${id}/${response.id}`, {
              type: response.type === 'checkbox' ? 'checkbox' : 'input',
            }),
          }}
          response={response}
        />
      ))}
      {showNextBtn && isPractice && checkClicked && (
        <Text>The correct answer is: {correctAnswer}</Text>
      )}

      <Group position="right" spacing="xs" mt="xl">
        {correctAnswer && isPractice && showNextBtn && (
          <Button
            onClick={() => setCheckClicked(true)}
            disabled={!answerValidator.isValid()}
          >
            Check Answer
          </Button>
        )}
        {showNextBtn && (
          <NextButton
            disabled={
              isSurvey
                ? !savedSurvey && !answerValidator.isValid()
                : (isPractice
                ? !checkClicked
                : !status?.complete && !areResponsesValid)
            }
            to={
              nextTrialId
                ? `/${studyId}/${currentStep}/${nextTrialId}`
                : `/${studyId}/${nextStep}`
            }
            process={processNext}
          />
        )}
      </Group>
    </>
  );
}