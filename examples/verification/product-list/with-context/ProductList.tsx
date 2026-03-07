import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import './ProductList.css';

type Category = 'すべて' | '家電' | '衣類' | '食品';

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  category: Exclude<Category, 'すべて'>;
}

const ALL_PRODUCTS: Product[] = [
  { id: 1, name: 'ワイヤレスイヤホン', price: 12800, rating: 4.5, category: '家電' },
  { id: 2, name: 'スマートウォッチ', price: 34500, rating: 4.2, category: '家電' },
  { id: 3, name: 'オーガニックコットンTシャツ', price: 3200, rating: 4.7, category: '衣類' },
  { id: 4, name: 'デニムジャケット', price: 8900, rating: 4.0, category: '衣類' },
  { id: 5, name: '有機栽培コーヒー豆', price: 1500, rating: 4.8, category: '食品' },
  { id: 6, name: 'グラノーラセット', price: 2400, rating: 4.3, category: '食品' },
  { id: 7, name: 'ポータブルスピーカー', price: 7600, rating: 4.1, category: '家電' },
  { id: 8, name: 'リネンシャツ', price: 5500, rating: 4.6, category: '衣類' },
  { id: 9, name: '抹茶パウダー', price: 980, rating: 4.9, category: '食品' },
];

const CATEGORIES: Category[] = ['すべて', '家電', '衣類', '食品'];
const PAGE_SIZE = 6;

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <span className="product-card__rating" aria-label={`評価: ${rating}点`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullStars) return <span key={i} className="star star--full" aria-hidden="true">★</span>;
        if (i === fullStars && hasHalf) return <span key={i} className="star star--half" aria-hidden="true">★</span>;
        return <span key={i} className="star star--empty" aria-hidden="true">☆</span>;
      })}
      <span className="product-card__rating-value">{rating}</span>
    </span>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (id: number) => void }) {
  return (
    <Card shadow="md" padding="md">
      <article className="product-card">
        <div className="product-card__image" aria-hidden="true" />
        <div className="product-card__body">
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__category">{product.category}</p>
          <StarRating rating={product.rating} />
          <p className="product-card__price">
            <span className="product-card__price-label">価格</span>
            <span className="product-card__price-value">¥{product.price.toLocaleString()}</span>
          </p>
        </div>
        <div className="product-card__footer">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAddToCart(product.id)}
          >
            カートに追加
          </Button>
        </div>
      </article>
    </Card>
  );
}

export function ProductList() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cartItems, setCartItems] = useState<number[]>([]);

  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === 'すべて' || p.category === activeCategory;
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleAddToCart(id: number) {
    setCartItems((prev) => [...prev, id]);
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  function handleCategoryChange(category: Category) {
    setActiveCategory(category);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <main className="product-list-page">
      <header className="product-list-page__header">
        <h1 className="product-list-page__title">商品一覧</h1>
        {cartItems.length > 0 && (
          <p className="product-list-page__cart-count" aria-live="polite">
            カート: {cartItems.length}件
          </p>
        )}
      </header>

      <section className="product-list-page__controls" aria-label="絞り込み">
        <div className="product-list-page__search">
          <Input
            label="商品を検索"
            placeholder="キーワードを入力"
            value={query}
            onChange={setQuery}
          />
        </div>

        <div className="product-list-page__filters" role="group" aria-label="カテゴリフィルター">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      <section aria-label="商品一覧">
        {visible.length > 0 ? (
          <ul className="product-list-page__grid" role="list">
            {visible.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="product-list-page__empty">該当する商品が見つかりませんでした。</p>
        )}
      </section>

      {hasMore && (
        <div className="product-list-page__load-more">
          <Button variant="ghost" onClick={handleLoadMore}>
            もっと見る
          </Button>
        </div>
      )}
    </main>
  );
}
