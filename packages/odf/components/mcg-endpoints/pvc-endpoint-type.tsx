import * as React from 'react';
import ResourceDropdown from '@odf/shared/dropdown/ResourceDropdown';
import { StorageClassModel } from '@odf/shared/models';
import { getName } from '@odf/shared/selectors';
import { StorageClass } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { RequestSizeInput } from '@odf/shared/utils/RequestSizeInput';
import { FormGroup, NumberInput } from '@patternfly/react-core';
import { createFormAction } from '../../constants';
import { isObjectSC } from '../../utils';
import {
  BackingStoreProviderDataState,
  BackingStoreAction,
} from '../create-bs/reducer';
import './noobaa-provider-endpoints.scss';

type PVCTypeProps = {
  state: BackingStoreProviderDataState;
  dispatch: React.Dispatch<BackingStoreAction>;
};

const storageClassResource = {
  kind: StorageClassModel.kind,
  namespaced: false,
  isList: true,
};

export const PVCType: React.FC<PVCTypeProps> = ({ state, dispatch }) => {
  const { t } = useCustomTranslation();

  const [size, setSize] = React.useState('50');
  const [, updateState] = React.useState(null);
  const units = {
    GiB: 'GiB',
    TiB: 'TiB',
  };

  // Noobaa expected Ti console standrad is to show TiB
  const unitConverter = {
    GiB: 'Gi',
    TiB: 'Ti',
  };

  // Fix for updating the storage class by force rerender
  const forceUpdate = React.useCallback(() => updateState({}), []);

  React.useEffect(() => {
    forceUpdate();
  }, [forceUpdate, state.storageClass]);

  const onChange = (event) => {
    const { value, unit } = event;
    const input = `${value}${unitConverter[unit]}`;
    setSize(value);
    dispatch({ type: createFormAction.SET_PVC_VOLUME_SIZE, value: input });
  };

  const onlyPvcSCs = React.useCallback(
    (sc: StorageClass) => !isObjectSC(sc),
    []
  );

  const onVolumeChange = (event) =>
    dispatch({
      type: createFormAction.SET_PVC_VOLUME,
      value: Number(event.target.value),
    });

  return (
    <>
      <FormGroup
        label={t('Number of Volumes')}
        fieldId="set-volumes"
        className="nb-endpoints-form-entry nb-endpoints-form-entry--short"
        isRequired
      >
        <NumberInput
          value={state.numVolumes}
          onChange={onVolumeChange}
          onMinus={() =>
            dispatch({
              type: createFormAction.SET_PVC_VOLUME,
              value: state.numVolumes - 1,
            })
          }
          onPlus={() =>
            dispatch({
              type: createFormAction.SET_PVC_VOLUME,
              value: state.numVolumes + 1,
            })
          }
          inputName="volume-input"
          inputAriaLabel="volumes-input"
          minusBtnAriaLabel="minus"
          plusBtnAriaLabel="plus"
          min={1}
        />
      </FormGroup>
      <FormGroup
        label={t('Volume Size')}
        fieldId="volume-size"
        className="nb-endpoints-form-entry nb-endpoints-form-entry--short"
        isRequired
      >
        <RequestSizeInput
          name={t('Volume Size')}
          onChange={onChange}
          dropdownUnits={units}
          defaultRequestSizeUnit="GiB"
          defaultRequestSizeValue={size}
        />
      </FormGroup>
      <FormGroup
        fieldId="storage-class"
        className="nb-endpoints-form-entry"
        isRequired
      >
        <ResourceDropdown<StorageClass>
          resourceModel={StorageClassModel}
          onSelect={(sc) =>
            dispatch({
              type: createFormAction.SET_PVC_STORAGE_CLASS,
              value: getName(sc),
            })
          }
          filterResource={onlyPvcSCs}
          className="odf-mcg__resource-dropdown"
          data-test="sc-dropdown"
          resource={storageClassResource}
        />
      </FormGroup>
    </>
  );
};
