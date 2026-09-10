import { useEffect, useState } from 'react'
import './App.css'

const PRODUCTS_PER_PAGE = 8

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productDetailLoading, setProductDetailLoading] = useState(false)
  const [productDetailError, setProductDetailError] = useState('')

  useEffect(() => {
    if (user && token) {
      fetchProducts()
    }
  }, [user, token, page])

  async function handleLogin(event) {
    event.preventDefault()
    setError('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      setError('Email and password are required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed.')
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      setUser(data.user)
      setToken(data.token)
      setPassword('')
      setPage(1)
    } catch {
      setError('Cannot connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      setProductsLoading(true)
      setProductsError('')

      const response = await fetch(
        `http://localhost:3000/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not load products.')
      }

      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      setProductsError(error.message || 'Could not load products.')
    } finally {
      setProductsLoading(false)
    }
  }

  async function openProduct(productId) {
    try {
      setProductDetailLoading(true)
      setProductDetailError('')
      setSelectedProduct(null)

      const response = await fetch(
        `http://localhost:3000/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not load product details.')
      }

      setSelectedProduct(data)
    } catch (error) {
      setProductDetailError(
        error.message || 'Could not load product details. Please try again.'
      )
    } finally {
      setProductDetailLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
    setProducts([])
    setPagination(null)
    setSelectedProduct(null)
    setPage(1)
  }

  function goToPreviousPage() {
    if (pagination?.hasPreviousPage) {
      setPage((currentPage) => currentPage - 1)
    }
  }

  function goToNextPage() {
    if (pagination?.hasNextPage) {
      setPage((currentPage) => currentPage + 1)
    }
  }

  if (!user || !token) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>Welcome back</h1>
          <p>Sign in to browse products.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Products</h1>
          <p>Welcome, {user.name}</p>
        </div>

        <button onClick={handleLogout}>Sign out</button>
      </header>

      {productsLoading && !selectedProduct && <ProductGridSkeleton />}

      {productsError && (
        <div>
          <p className="error-message">{productsError}</p>
          <button onClick={fetchProducts}>Try again</button>
        </div>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <p>No products available yet.</p>
      )}

      {productDetailLoading && <ProductDetailSkeleton />}

      {productDetailError && (
        <div>
          <p className="error-message">{productDetailError}</p>
          <button onClick={() => setProductDetailError('')}>
            Back to products
          </button>
        </div>
      )}

      {selectedProduct && (
        <section className="product-detail">
          <button
            className="back-button"
            onClick={() => setSelectedProduct(null)}
          >
            ← Back to products
          </button>

          <div className="product-detail-content">
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              onError={(event) => {
                event.currentTarget.src =
                  'https://placehold.co/700x500?text=No+image'
              }}
            />

            <div>
              <h1>{selectedProduct.name}</h1>

              <p className="detail-price">
                ${Number(selectedProduct.price).toFixed(2)}
              </p>

              <p className="detail-description">
                {selectedProduct.description || 'No description available.'}
              </p>

              <p className="product-meta">
                Product ID: {selectedProduct.id}
              </p>

              <p className="product-meta">
                Added:{' '}
                {new Date(selectedProduct.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>
      )}

      {!selectedProduct &&
        !productDetailLoading &&
        !productDetailError &&
        !productsLoading &&
        !productsError &&
        products.length > 0 && (
          <>
            <section className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.id}>
                  <button
                    className="product-card-button"
                    onClick={() => openProduct(product.id)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.src =
                          'https://placehold.co/400x300?text=No+image'
                      }}
                    />

                    <div className="product-card-content">
                      <h2>{product.name}</h2>
                      <p>${Number(product.price).toFixed(2)}</p>
                    </div>
                  </button>
                </article>
              ))}
            </section>

            {pagination && (
              <nav className="pagination" aria-label="Product pages">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
    </main>
  )
}

function ProductDetailSkeleton() {
  return (
    <section className="product-detail" aria-label="Loading product details">
      <div className="skeleton skeleton-back-button" />

      <div className="product-detail-content">
        <div className="skeleton skeleton-detail-image" />

        <div className="detail-skeleton-content">
          <div className="skeleton skeleton-detail-title" />
          <div className="skeleton skeleton-detail-price" />
          <div className="skeleton skeleton-detail-line" />
          <div className="skeleton skeleton-detail-line" />
          <div className="skeleton skeleton-detail-line short-line" />
        </div>
      </div>
    </section>
  )
}

function ProductGridSkeleton() {
  return (
    <section className="product-grid" aria-label="Loading products">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
        <article className="product-card skeleton-card" key={index}>
          <div className="skeleton skeleton-image" />

          <div className="product-card-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-price" />
          </div>
        </article>
      ))}
    </section>
  )
}

export default App;