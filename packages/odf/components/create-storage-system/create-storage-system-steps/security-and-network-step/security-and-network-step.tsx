import * as React from 'react';
import { getNamespace, getName } from '@odf/shared/selectors';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk-internal/lib/extensions/console-types';
import { Form } from '@patternfly/react-core';
import { FEATURES } from '../../../../features';
import { NetworkType, NADSelectorType } from '../../../../types';
import { WizardDispatch, WizardState } from '../../reducer';
import { ConnectionDetails } from '../connection-details-step';
import { NetworkFormGroup } from './configure';
import { Encryption } from './encryption';

export const SecurityAndNetwork: React.FC<SecurityAndNetworkProps> = ({
  state,
  dispatch,
  infraType,
  isExternal,
}) => {
  const isMultusSupported = useFlag(FEATURES.OCS_MULTUS);

  const {
    networkType: nwType,
    clusterNetwork,
    publicNetwork,
    encryption,
    kms,
  } = state.securityAndNetwork;

  const setNetworkType = (networkType: NetworkType) => {
    dispatch({
      type: 'securityAndNetwork/setNetworkType',
      payload: networkType,
    });
    if (networkType === NetworkType.DEFAULT) {
      dispatch({ type: 'securityAndNetwork/setClusterNetwork', payload: '' });
      dispatch({ type: 'securityAndNetwork/setPublicNetwork', payload: '' });
    }
  };

  const setNetwork = (network: NADSelectorType, resource: K8sResourceCommon) =>
    dispatch({
      type:
        network === NADSelectorType.CLUSTER
          ? 'securityAndNetwork/setClusterNetwork'
          : 'securityAndNetwork/setPublicNetwork',
      payload: `${getNamespace(resource)}/${getName(resource)}`,
    });

  return (
    <Form noValidate={false}>
      <Encryption
        encryption={encryption}
        kms={kms}
        dispatch={dispatch}
        infraType={infraType}
        isExternal={isExternal}
      />
      {!isExternal && isMultusSupported && (
        <NetworkFormGroup
          networkType={nwType}
          setNetworkType={setNetworkType}
          setNetwork={setNetwork}
          publicNetwork={publicNetwork}
          clusterNetwork={clusterNetwork}
        />
      )}
      {isExternal && (
        <ConnectionDetails
          state={state.connectionDetails}
          dispatch={dispatch}
          externalStorage={state.backingStorage.externalStorage}
        />
      )}
    </Form>
  );
};

type SecurityAndNetworkProps = {
  state: WizardState;
  dispatch: WizardDispatch;
  infraType: string;
  isExternal?: boolean;
};
