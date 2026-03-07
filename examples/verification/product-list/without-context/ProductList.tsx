import React, { useState } from "react";
import "./ProductList.css";

// --- 型定義 ---

type Category = "all" | "electronics" | "clothing" | "food";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: Category;
}

// --- モックデータ ---

const ALL_PRODUCTS: Product[] = [
  { id: 1, name: "ワイヤレスイヤホン",       price: 12800, rating: 4.5, reviewCount: 320, category: "electronics" },
  { id: 2, name: "スマートウォッチ",          price: 34800, rating: 4.2, reviewCount: 185, category: "electronics" },
  { id: 3, name: "メンズTシャツ（白）",       price:  2980, rating: 4.0, reviewCount:  92, category: "clothing"    },
  { id: 4, name: "レディースデニムジャケット", price:  8900, rating: 4.7, reviewCount: 241, category: "clothing"    },
  { id: 5, name: "プレミアムグリーンティー",   price:  1480, rating: 4.8, reviewCount: 512, category: "food"        },
  { id: 6, name: "オーガニックナッツミックス", price:  2200, rating: 4.3, reviewCount: 178, category: "food"        },
  { id: 7, name: "Bluetoothスピーカー",       price: 18500, rating: 4.1, reviewCount: 137, category: "electronics" },
  { id: 8, name: "ウールセーター",            price:  6800, rating: 4.4, reviewCount:  63, category: "clothing"    },
  { id: 9, name: "ハンドドリップコーヒー豆",   price:  1980, rating: 4.6, reviewCount: 290, category: "food"        },
];

const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 3;

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all",         label: "すべて" },
  { value: "electronics", label: "家電"   },
  { value: "clothing",    label: "衣類"   },
  { value: "food",        label: "食品"   },
];

// --- 星評価コンポーネント ---

interface StarRatingProps {
  rating: number;
  reviewCount: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, reviewCount }) => {
  const fullStars  = Math.floor(rating);
  const hasHalf    = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <p className="product-card__rating" aria-label={`評価 ${rating} / 5（${reviewCount}件のレビュー）`}>
      <span className="product-card__stars" aria-hidden="true">
        {"★".repeat(fullStars)}
        {hasHalf ? "½" : ""}
        {"☆".repeat(emptyStars)}
      </span>
      <span className="product-card__review-count">({reviewCount})</span>
    </p>
  );
};

// --- 商品カードコンポーネント ---

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
  <article className="product-card" aria-label={product.name}>
    <div className="product-card__image" aria-hidden="true">
      <span className="product-card__image-placeholder">
        {product.category === "electronics" ? "⚡" : product.category === "clothing" ? "👕" : "🍃"}
      </span>
    </div>
    <div className="product-card__body">
      <h3 className="product-card__name">{product.name}</h3>
      <StarRating rating={product.rating} reviewCount={product.reviewCount} />
      <p className="product-card__price" aria-label={`価格 ${product.price.toLocaleString()}円`}>
        ¥{product.price.toLocaleString()}
      </p>
      <button
        type="button"
        className="btn btn--primary product-card__add-btn"
        onClick={() => onAddToCart(product)}
        aria-label={`${product.name}をカートに追加`}
      >
        カートに追加
      </button>
    </div>
  </article>
);

// --- メイン商品一覧コンポーネント ---

const ProductList: React.FC = () => {
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [visibleCount,   setVisibleCount]   = useState(INITIAL_VISIBLE_COUNT);
  const [notification,   setNotification]   = useState<string | null>(null);

  // フィルタリング
  const filteredProducts = ALL_PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch   = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore         = visibleCount < filteredProducts.length;

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleAddToCart = (product: Product) => {
    setNotification(`「${product.name}」をカートに追加しました`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

  return (
    <div className="product-list-page">
      {/* スキップリンク */}
      <a href="#main-content" className="skip-link">メインコンテンツへスキップ</a>

      {/* ヘッダー */}
      <header className="site-header" role="banner">
        <div className="site-header__inner">
          <span className="site-header__logo">ShopAI</span>
        </div>
      </header>

      {/* 通知 */}
      {notification && (
        <div
          className="cart-notification"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {notification}
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="product-list-page__main" id="main-content">
        <div className="product-list-page__container">

          <h1 className="page-title">商品一覧</h1>

          {/* 検索バー */}
          <section aria-labelledby="search-heading" className="search-section">
            <h2 id="search-heading" className="visually-hidden">商品を検索</h2>
            <div className="search-bar">
              <label htmlFor="product-search" className="visually-hidden">
                商品を検索
              </label>
              <span className="search-bar__icon" aria-hidden="true">🔍</span>
              <input
                id="product-search"
                type="search"
                className="search-bar__input"
                placeholder="商品名で検索..."
                value={searchQuery}
                onChange={handleSearch}
                aria-label="商品名で検索"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-bar__clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="検索をクリア"
                >
                  ✕
                </button>
              )}
            </div>
          </section>

          {/* カテゴリフィルター */}
          <section aria-labelledby="filter-heading" className="filter-section">
            <h2 id="filter-heading" className="visually-hidden">カテゴリで絞り込む</h2>
            <div className="category-filter" role="group" aria-label="カテゴリフィルター">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`btn btn--filter${activeCategory === cat.value ? " btn--filter-active" : ""}`}
                  onClick={() => handleCategoryChange(cat.value)}
                  aria-pressed={activeCategory === cat.value}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* 件数表示 */}
          <p
            className="result-count"
            aria-live="polite"
            aria-atomic="true"
          >
            {filteredProducts.length === 0
              ? "該当する商品が見つかりませんでした"
              : `${filteredProducts.length}件の商品`}
          </p>

          {/* 商品グリッド */}
          {filteredProducts.length > 0 ? (
            <section aria-labelledby="products-heading">
              <h2 id="products-heading" className="visually-hidden">商品一覧</h2>
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              {/* もっと見るボタン */}
              {hasMore && (
                <div className="load-more-wrapper">
                  <button
                    type="button"
                    className="btn btn--load-more"
                    onClick={handleLoadMore}
                    aria-label={`さらに商品を表示（残り${filteredProducts.length - visibleCount}件）`}
                  >
                    もっと見る
                    <span className="btn__count" aria-hidden="true">
                      （残り{filteredProducts.length - visibleCount}件）
                    </span>
                  </button>
                </div>
              )}
            </section>
          ) : (
            <div className="empty-state" role="region" aria-label="検索結果なし">
              <p className="empty-state__icon" aria-hidden="true">🔍</p>
              <p className="empty-state__message">
                条件に一致する商品が見つかりませんでした。<br />
                検索キーワードやカテゴリを変更してみてください。
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ProductList;
