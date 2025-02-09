import * as React from 'react';
import { CEPH_STORAGE_NAMESPACE } from '@odf/shared/constants';
import DetailsPage from '@odf/shared/details-page/DetailsPage';
import { SectionHeading } from '@odf/shared/heading/page-heading';
import { useDeepCompareMemoize } from '@odf/shared/hooks/deep-compare-memoize';
import { Kebab } from '@odf/shared/kebab/kebab';
import { K8sResourceKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel } from '@odf/shared/utils';
import { EventStreamWrapped, YAMLEditorWrapped } from '@odf/shared/utils/Tabs';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { RouteComponentProps } from 'react-router';
import { NooBaaBackingStoreModel } from '../../models';
import { BackingStoreKind } from '../../types';
import { CommonDetails } from './CommonDetails';
import ProviderDetails from './Providers';

type BackingStoreDetilsPageProps = {
  match: RouteComponentProps<{ resourceName: string; plural: string }>['match'];
};

type DetailsProps = {
  obj: BackingStoreKind;
} & RouteComponentProps;

const BSDetails: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useCustomTranslation();
  return (
    <CommonDetails resourceModel={NooBaaBackingStoreModel} resource={obj}>
      <SectionHeading text={t('Provider details')} />
      <div className="row">
        <div className="col-sm-6">
          <ProviderDetails resource={obj} />
        </div>
      </div>
    </CommonDetails>
  );
};

const BackingStoreDetailsPage: React.FC<BackingStoreDetilsPageProps> = ({
  match,
}) => {
  const { t } = useCustomTranslation();
  const { resourceName: name } = match.params;
  const [resource, loaded, loadError] = useK8sWatchResource<K8sResourceKind>({
    kind: referenceForModel(NooBaaBackingStoreModel),
    name,
    namespace: CEPH_STORAGE_NAMESPACE,
    isList: false,
  });

  const breadcrumbs = [
    {
      name: t('Object Storage'),
      path: '/odf/object-storage',
    },
    {
      name: t('BackingStores'),
      path: '/odf/object-storage/resource/noobaa.io~v1alpha1~BackingStore',
    },
    {
      name: t('BackingStore details'),
      path: '',
    },
  ];

  const memoizedResource = useDeepCompareMemoize(resource, true);

  const actions = React.useCallback(() => {
    return (
      <Kebab
        toggleType="Dropdown"
        extraProps={{
          resource: memoizedResource,
          resourceModel: NooBaaBackingStoreModel,
        }}
      />
    );
  }, [memoizedResource]);

  return (
    <>
      <DetailsPage
        loaded={loaded}
        loadError={loadError}
        breadcrumbs={breadcrumbs}
        actions={actions}
        resourceModel={NooBaaBackingStoreModel}
        resource={resource}
        pages={[
          {
            href: '',
            name: 'Details',
            component: BSDetails,
          },
          {
            href: 'yaml',
            name: 'YAML',
            component: YAMLEditorWrapped,
          },
          {
            href: 'events',
            name: 'Events',
            component: EventStreamWrapped,
          },
        ]}
      />
    </>
  );
};

export default BackingStoreDetailsPage;
