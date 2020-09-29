import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const keys = await AsyncStorage.getAllKeys();
      const results = await AsyncStorage.multiGet(keys);

      const allProducts = results.map(
        result => result[1] && JSON.parse(result[1]),
      );

      setProducts(allProducts);

      // await AsyncStorage.clear();
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      if (product.quantity) {
        // eslint-disable-next-line no-param-reassign
        product.quantity += 1;

        await AsyncStorage.setItem(
          `@GoMarketProduct:${product.id}`,
          `${JSON.stringify(product)}`,
        );

        setProducts([
          ...products.filter(prod => prod.id !== product.id),
          product,
        ]);
      } else {
        // eslint-disable-next-line no-param-reassign
        product.quantity = 1;

        await AsyncStorage.setItem(
          `@GoMarketProduct:${product.id}`,
          `${JSON.stringify(product)}`,
        );

        setProducts([...products, product]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);

      if (product) {
        product.quantity += 1;

        await AsyncStorage.setItem(
          `@GoMarketProduct:${product.id}`,
          `${JSON.stringify(product)}`,
        );

        setProducts([...products.filter(prod => prod.id !== id), product]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(prod => prod.id === id);

      if (product) {
        if (product.quantity === 1) {
          product.quantity -= 1;

          await AsyncStorage.removeItem(`@GoMarketProduct:${product.id}`);

          setProducts([...products.filter(prod => prod.id !== id)]);

          return;
        }

        product.quantity -= 1;

        await AsyncStorage.setItem(
          `@GoMarketProduct:${product.id}`,
          `${JSON.stringify(product)}`,
        );

        setProducts([...products.filter(prod => prod.id !== id), product]);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
