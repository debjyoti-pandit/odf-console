import * as React from 'react';
import { StorageClassWizardStepExtensionProps as ExternalStorage } from '@odf/odf-plugin-sdk/extensions';
import { OCSStorageClusterModel } from '@odf/shared/models';
import { TFunction } from 'i18next';
import { RouteComponentProps } from 'react-router';
import { WizardStep } from '@patternfly/react-core';
import { Steps, StepsName } from '../../constants';
import { BackingStorageType, DeploymentType } from '../../types';
import {
  CapacityAndNodes,
  CreateStorageClass,
  ReviewAndCreate,
  CreateLocalVolumeSet,
  SecurityAndNetwork,
  Security,
  ConnectionDetails,
} from './create-storage-system-steps';
import { WizardDispatch, WizardState } from './reducer';

export const createSteps = (
  t: TFunction,
  state: WizardState,
  dispatch: WizardDispatch,
  infraType: string,
  hasOCS: boolean,
  history: RouteComponentProps['history'],
  supportedExternalStorage: ExternalStorage[]
): WizardStep[] => {
  const {
    backingStorage,
    stepIdReached,
    createStorageClass,
    storageClass,
    capacityAndNodes,
    securityAndNetwork,
    nodes,
    createLocalVolumeSet,
  } = state;
  const { externalStorage, deployment } = backingStorage;
  const { encryption, kms } = securityAndNetwork;

  const isMCG = deployment === DeploymentType.MCG;

  const commonSteps = {
    capacityAndNodes: {
      name: StepsName(t)[Steps.CapacityAndNodes],
      component: (
        <CapacityAndNodes
          dispatch={dispatch}
          state={capacityAndNodes}
          storageClass={storageClass}
          volumeSetName={createLocalVolumeSet.volumeSetName}
          nodes={nodes}
        />
      ),
    },
    securityAndNetwork: {
      name: StepsName(t)[Steps.SecurityAndNetwork],
      component: (
        <SecurityAndNetwork
          securityAndNetworkState={securityAndNetwork}
          dispatch={dispatch}
          infraType={infraType}
        />
      ),
    },
    security: {
      name: StepsName(t)[Steps.Security],
      component: (
        <Security
          infraType={infraType}
          encryption={encryption}
          kms={kms}
          dispatch={dispatch}
          isMCG
        />
      ),
    },
    reviewAndCreate: {
      name: StepsName(t)[Steps.ReviewAndCreate],
      component: (
        <ReviewAndCreate
          state={state}
          hasOCS={hasOCS}
          supportedExternalStorage={supportedExternalStorage}
        />
      ),
    },
  };

  const rhcsExternalProviderSteps: WizardStep[] = [
    {
      name: StepsName(t)[Steps.ConnectionDetails],
      canJumpTo: stepIdReached >= 2,
      id: 2,
      component: (
        <ConnectionDetails
          state={state.connectionDetails}
          dispatch={dispatch}
          externalStorage={externalStorage}
          supportedExternalStorage={supportedExternalStorage}
        />
      ),
    },
    {
      name: StepsName(t)[Steps.ReviewAndCreate],
      canJumpTo: stepIdReached >= 3,
      id: 3,
      ...commonSteps.reviewAndCreate,
    },
  ];

  const nonRhcsExternalProviderStep: WizardStep = {
    canJumpTo: stepIdReached >= 2,
    id: 2,
    name: StepsName(t)[Steps.CreateStorageClass],
    component: (
      <CreateStorageClass
        state={createStorageClass}
        externalStorage={externalStorage}
        dispatch={dispatch}
        storageClass={storageClass}
        supportedExternalStorage={supportedExternalStorage}
      />
    ),
  };

  const createLocalVolumeSetStep: WizardStep = {
    name: StepsName(t)[Steps.CreateLocalVolumeSet],
    canJumpTo: stepIdReached >= 2,
    id: 2,
    component: (
      <CreateLocalVolumeSet
        state={createLocalVolumeSet}
        dispatch={dispatch}
        storageClass={storageClass}
        nodes={nodes}
        stepIdReached={stepIdReached}
        isMCG={isMCG}
        history={history}
      />
    ),
  };

  switch (backingStorage.type) {
    case BackingStorageType.EXISTING:
      return isMCG
        ? [
            {
              id: 2,
              canJumpTo: stepIdReached >= 2,
              ...commonSteps.security,
            },
            {
              id: 3,
              canJumpTo: stepIdReached >= 3,
              ...commonSteps.reviewAndCreate,
            },
          ]
        : [
            {
              id: 2,
              canJumpTo: stepIdReached >= 2,
              ...commonSteps.capacityAndNodes,
            },
            {
              id: 3,
              canJumpTo: stepIdReached >= 3,
              ...commonSteps.securityAndNetwork,
            },
            {
              id: 4,
              canJumpTo: stepIdReached >= 4,
              ...commonSteps.reviewAndCreate,
            },
          ];
    case BackingStorageType.LOCAL_DEVICES:
      return isMCG
        ? [
            createLocalVolumeSetStep,
            {
              id: 3,
              canJumpTo: stepIdReached >= 3,
              ...commonSteps.security,
            },
            {
              id: 4,
              canJumpTo: stepIdReached >= 4,
              ...commonSteps.reviewAndCreate,
            },
          ]
        : [
            createLocalVolumeSetStep,
            {
              canJumpTo: stepIdReached >= 3,
              ...commonSteps.capacityAndNodes,
              id: 3,
            },
            {
              canJumpTo: stepIdReached >= 4,
              name: StepsName(t)[Steps.SecurityAndNetwork],
              ...commonSteps.securityAndNetwork,
              id: 4,
            },
            {
              canJumpTo: stepIdReached >= 5,
              name: StepsName(t)[Steps.ReviewAndCreate],
              ...commonSteps.reviewAndCreate,
              id: 5,
            },
          ];
    case BackingStorageType.EXTERNAL:
      if (externalStorage === OCSStorageClusterModel.kind) {
        return rhcsExternalProviderSteps;
      }
      if (!hasOCS) {
        return isMCG
          ? [
              nonRhcsExternalProviderStep,
              {
                id: 3,
                canJumpTo: stepIdReached >= 3,
                ...commonSteps.security,
              },
              {
                id: 4,
                canJumpTo: stepIdReached >= 4,
                ...commonSteps.reviewAndCreate,
              },
            ]
          : [
              nonRhcsExternalProviderStep,
              {
                canJumpTo: stepIdReached >= 3,
                id: 3,
                ...commonSteps.capacityAndNodes,
              },
              {
                canJumpTo: stepIdReached >= 4,
                id: 4,
                ...commonSteps.securityAndNetwork,
              },
              {
                canJumpTo: stepIdReached >= 5,
                id: 5,
                ...commonSteps.reviewAndCreate,
              },
            ];
      }
      return [
        nonRhcsExternalProviderStep,
        {
          canJumpTo: stepIdReached >= 3,
          id: 3,
          ...commonSteps.reviewAndCreate,
        },
      ];
    default:
      return [];
  }
};
