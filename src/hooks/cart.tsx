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
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:Products',
      );

      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    // async function clearProducts(): Promise<void> {
    //   await AsyncStorage.clear();
    //   setProducts([]);
    // }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const existingProduct = products.find(item => item.id === id);
      if (existingProduct) {
        existingProduct.quantity += 1;
        setProducts([...products]);

        await AsyncStorage.setItem(
          '@GoMarketplace:Products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const existingProduct = products.find(item => item.id === id);

      if (existingProduct) {
        const quantity = existingProduct.quantity - 1;
        if (quantity === 0) {
          const productsList = products.filter(item => item.id !== id);
          setProducts(productsList);
        } else {
          existingProduct.quantity -= 1;
          setProducts([...products]);
        }

        await AsyncStorage.setItem(
          '@GoMarketplace:Products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async ({ id, title, image_url, price }) => {
      const existingProduct = products.find(item => item.id === id);
      if (existingProduct) {
        await increment(id);
      } else {
        const newProduct = { id, title, image_url, price, quantity: 1 };
        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketplace:Products',
          JSON.stringify(products),
        );
      }
    },
    [products, increment],
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
