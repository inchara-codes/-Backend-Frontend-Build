import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productDetailLoading, setProductDetailLoading] = useState(false)
  const [productDetailError, setProductDetailError] = useState('')

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  async function handleLogin(event) {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed.')
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setPassword('')
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

      const response = await fetch('http://localhost:3000/products')

      if (!response.ok) {
        throw new Error('Could not load products.')
      }

      const data = await response.json()
      setProducts(data)
    } catch {
      setProductsError('Could not load products. Please try again.')
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
        `http://localhost:3000/products/${productId}`
      )

      if (!response.ok) {
        throw new Error('Could not load product details.')
      }

      const data = await response.json()
      setSelectedProduct(data)
    } catch {
      setProductDetailError(
        'Could not load product details. Please go back and try again.'
      )
    } finally {
      setProductDetailLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('user')
    setUser(null)
    setProducts([])
    setSelectedProduct(null)
  }

  if (!user) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>Welcome back</h1>
          <p>Sign in to browse products.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
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

      {productsLoading && <p>Loading products...</p>}

      {productsError && (
        <div>
          <p className="error-message">{productsError}</p>
          <button onClick={fetchProducts}>Try again</button>
        </div>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <p>No products available yet.</p>
      )}

      {productDetailLoading && <p>Loading product details...</p>}

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
        )}
    </main>
  )
}

export default App;