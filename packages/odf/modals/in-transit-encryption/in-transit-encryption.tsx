import * as React from 'react';
import { StorageClusterModel } from '@odf/ocs/models';
import { getNetworkEncryption } from '@odf/ocs/utils';
import { CommonModalProps } from '@odf/shared/modals/common';
import { ModalBody, ModalFooter, ModalHeader } from '@odf/shared/modals/Modal';
import { StorageClusterKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { k8sPatchByName } from '@odf/shared/utils';
import { Patch } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, Button, Modal, ModalVariant } from '@patternfly/react-core';

type InTransitEncryptionModalExtraProps = {
  cluster: StorageClusterKind;
};

const InTransitEncryptionModal: React.FC<
  CommonModalProps<InTransitEncryptionModalExtraProps>
> = ({ closeModal, isOpen, extraProps: { cluster } }) => {
  const { t } = useCustomTranslation();
  const [inTransitEnabled, setInTransitEnabled] = React.useState(
    getNetworkEncryption(cluster)
  );
  const [error, setError] = React.useState('');

  const submit = async (event) => {
    event.preventDefault();

    const patch: Patch[] =
      cluster?.spec?.network?.connections?.encryption?.enabled === undefined
        ? [
            {
              op: 'add',
              path: '/spec/network/connections/encryption',
              value: Object.freeze({
                enabled: !inTransitEnabled,
              }),
            },
          ]
        : [
            {
              op: 'replace',
              path: '/spec/network/connections/encryption/enabled',
              value: !inTransitEnabled,
            },
          ];
    try {
      await k8sPatchByName(
        StorageClusterModel,
        cluster.metadata.name,
        cluster.metadata.namespace,
        patch
      );
      setInTransitEnabled(!inTransitEnabled);
      closeModal();
    } catch (error) {
      setError(error);
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      header={
        <ModalHeader>
          {t('{{status}} in transit encryption', {
            status: !getNetworkEncryption(cluster) //negating as we need to perform the opposite action
              ? t('Enable')
              : t('Disable'),
          })}
        </ModalHeader>
      }
      isOpen={isOpen}
      onClose={closeModal}
      showClose={false}
      hasNoBodyWrapper={true}
    >
      <ModalBody>
        {!getNetworkEncryption(cluster) //negating as we need to perform the opposite action
          ? t('All data passing over the internet will be encrypted')
          : t('Communication over internet will not be encrypted')}
        {error && (
          <Alert isInline variant="danger" title={t('An error occurred')}>
            {(error as any)?.message}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          key="in-transit-encryption"
          variant={getNetworkEncryption(cluster) ? 'danger' : 'primary'}
          onClick={submit}
          data-test="in-transit-encryption-action"
        >
          {!getNetworkEncryption(cluster) //negating as we need to perform the opposite action
            ? t('Enable')
            : t('Disable')}
        </Button>
        <Button
          key="cancel"
          variant="secondary"
          onClick={closeModal}
          data-test="cancel-action"
        >
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default InTransitEncryptionModal;
