import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { react2angular } from 'react2angular';
import { Loader } from '../base/loader';
import { IApplication } from '../../models/application';
import { ProductForm } from './product-form';
import { Product } from '../../models/product';
import ProductAPI from '../../api/product';
import { UIRouter } from '@uirouter/angularjs';

declare const Application: IApplication;

interface EditProductProps {
  productId: number,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  uiRouter: UIRouter
}

/**
 * This component show edit product form
 */
const EditProduct: React.FC<EditProductProps> = ({ productId, onSuccess, onError, uiRouter }) => {
  const { t } = useTranslation('admin');

  const [product, setProduct] = useState<Product>();

  useEffect(() => {
    ProductAPI.get(productId).then(data => {
      setProduct(data);
    }).catch(onError);
  }, []);

  /**
   * Success to save product and return to product list
   */
  const saveProductSuccess = () => {
    onSuccess(t('app.admin.store.edit_product.successfully_updated'));
    window.location.href = '/#!/admin/store/products';
  };

  if (product) {
    return (
      <div className="edit-product">
        <ProductForm product={product}
                     title={product.name}
                     onSuccess={saveProductSuccess}
                     onError={onError}
                     uiRouter={uiRouter} />
      </div>
    );
  }
  return null;
};

const EditProductWrapper: React.FC<EditProductProps> = (props) => {
  return (
    <Loader>
      <EditProduct {...props} />
    </Loader>
  );
};

Application.Components.component('editProduct', react2angular(EditProductWrapper, ['productId', 'onSuccess', 'onError', 'uiRouter']));
