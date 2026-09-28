import { useEffect, useState } from 'react'
import './App.css'

const PRODUCTS_PER_PAGE = 8

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getProductImageUrl(imageUrl) {
  if (imageUrl?.startsWith('/uploads/')) {
    return `${API_URL}${imageUrl}`
  }

  return imageUrl
}

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  })

  const isAdmin = user?.role === 'admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
  })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productDetailLoading, setProductDetailLoading] = useState(false)
  const [productDetailError, setProductDetailError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  })
  const [createProductError, setCreateProductError] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)

  const [showEditForm, setShowEditForm] = useState(false)
  const [editProduct, setEditProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  })
  const [editProductError, setEditProductError] = useState('')
  const [updatingProduct, setUpdatingProduct] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)

  const [showAdminPage, setShowAdminPage] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [adminPageLoading, setAdminPageLoading] = useState(false)
  const [adminPageError, setAdminPageError] = useState('')
  const [updatingRoleId, setUpdatingRoleId] = useState(null)

  useEffect(() => {
    if (user && token) {
      fetchProducts()
    }
  }, [user, token, page, filters])

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

      const response = await fetch(`${API_URL}/auth/login`, {
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
  async function handleRegister(event) {
    event.preventDefault()
    setError('')

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedName || !normalizedEmail || !password) {
      setError('Name, email, and password are required.')
      return
    }

    if (normalizedName.length > 100) {
      setError('Name must be 100 characters or fewer.')
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

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed.')
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      setUser(data.user)
      setToken(data.token)
      setName('')
      setEmail('')
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

      const query = new URLSearchParams({
        page: String(page),
        limit: String(PRODUCTS_PER_PAGE),
      })

      if (filters.search) query.set('search', filters.search)
      if (filters.minPrice) query.set('minPrice', filters.minPrice)
      if (filters.maxPrice) query.set('maxPrice', filters.maxPrice)

      const response = await fetch(`${API_URL}/products?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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


  function applyFilters(event) {
    event.preventDefault()
    setProductsError('')

    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setProductsError('Minimum price cannot be greater than maximum price.')
      return
    }

    setPage(1)
    setFilters({
      search: search.trim(),
      minPrice,
      maxPrice,
    })
  }

  function clearFilters() {
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
    })
  }

  async function openProduct(productId) {
    try {
      setProductDetailLoading(true)
      setProductDetailError('')
      setSelectedProduct(null)

      const response = await fetch(
        `${API_URL}/products/${productId}`,
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

  function openCreateProductForm() {
    setSelectedProduct(null)
    setProductDetailError('')
    setCreateProductError('')
    setShowCreateForm(true)
  }

  function closeCreateProductForm() {
    setCreateProductError('')
    setShowCreateForm(false)
  }

  async function handleCreateProduct(event) {
    event.preventDefault()
    setCreateProductError('')

    const name = newProduct.name.trim()
    const price = Number(newProduct.price)

    if (!name) {
      setCreateProductError('Product name is required.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setCreateProductError('Enter a valid non-negative price.')
      return
    }

    if (!newProduct.image) {
      setCreateProductError('Please choose a JPEG, PNG, or WebP image.')
      return
    }

    try {
      setCreatingProduct(true)

      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', newProduct.description.trim())
      formData.append('price', String(price))
      formData.append('image', newProduct.image)

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not create product.')
      }

      setNewProduct({
        name: '',
        description: '',
        price: '',
        image: null,
      })
      setShowCreateForm(false)

      if (page === 1) {
        fetchProducts()
      } else {
        setPage(1)
      }
    } catch (error) {
      setCreateProductError(error.message || 'Could not create product.')
    } finally {
      setCreatingProduct(false)
    }
  }

  function openEditProductForm() {
    if (!selectedProduct) return

    setEditProduct({
      name: selectedProduct.name,
      description: selectedProduct.description || '',
      price: String(selectedProduct.price),
      image: null,
    })
    setEditProductError('')
    setShowEditForm(true)
  }

  function closeEditProductForm() {
    setEditProductError('')
    setShowEditForm(false)
  }

  async function handleUpdateProduct(event) {
    event.preventDefault()
    setEditProductError('')

    const name = editProduct.name.trim()
    const price = Number(editProduct.price)

    if (!name) {
      setEditProductError('Product name is required.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setEditProductError('Enter a valid non-negative price.')
      return
    }

    try {
      setUpdatingProduct(true)

      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', editProduct.description.trim())
      formData.append('price', String(price))

      if (editProduct.image) {
        formData.append('image', editProduct.image)
      }

      const response = await fetch(
        `${API_URL}/products/${selectedProduct.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not update product.')
      }

      setSelectedProduct(data.product)
      setShowEditForm(false)
      fetchProducts()
    } catch (error) {
      setEditProductError(error.message || 'Could not update product.')
    } finally {
      setUpdatingProduct(false)
    }
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return

    const shouldDelete = window.confirm(
      `Delete "${selectedProduct.name}"? This cannot be undone.`
    )

    if (!shouldDelete) return

    try {
      setDeletingProduct(true)

      const response = await fetch(
        `${API_URL}/products/${selectedProduct.id}`,
        {
          method: 'DELETE',
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
        throw new Error(data.message || 'Could not delete product.')
      }

      setSelectedProduct(null)
      setShowEditForm(false)
      fetchProducts()
    } catch (error) {
      setProductDetailError(error.message || 'Could not delete product.')
    } finally {
      setDeletingProduct(false)
    }
  }

  async function fetchAdminData() {
    try {
      setAdminPageLoading(true)
      setAdminPageError('')

      const [usersResponse, logsResponse] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/admin/audit-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      const [usersData, logsData] = await Promise.all([
        usersResponse.json(),
        logsResponse.json(),
      ])

      if (usersResponse.status === 401 || logsResponse.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'Could not load users.')
      }

      if (!logsResponse.ok) {
        throw new Error(logsData.message || 'Could not load audit history.')
      }

      setAdminUsers(usersData.users)
      setAuditLogs(logsData.logs)
    } catch (error) {
      setAdminPageError(error.message || 'Could not load admin data.')
    } finally {
      setAdminPageLoading(false)
    }
  }

  function openAdminPage() {
    setSelectedProduct(null)
    setShowCreateForm(false)
    setShowEditForm(false)
    setShowAdminPage(true)
    fetchAdminData()
  }

  async function handleRoleChange(targetUser, nextRole) {
    const action =
      nextRole === 'admin'
        ? `Make ${targetUser.name} an admin?`
        : `Remove admin access from ${targetUser.name}?`

    if (!window.confirm(action)) return

    try {
      setUpdatingRoleId(targetUser.id)
      setAdminPageError('')

      const response = await fetch(
        `${API_URL}/admin/users/${targetUser.id}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: nextRole }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not update this user role.')
      }

      await fetchAdminData()
    } catch (error) {
      setAdminPageError(error.message || 'Could not update this user role.')
    } finally {
      setUpdatingRoleId(null)
    }
  }

  function describeAuditLog(log) {
    let details = log.details || {}

    if (typeof details === 'string') {
      try {
        details = JSON.parse(details)
      } catch {
        details = {}
      }
    }

    if (log.action === 'product_created') {
      return `Added product: ${details.productName || `#${log.entity_id}`}`
    }

    if (log.action === 'product_updated') {
      return `Edited product: ${details.productName || `#${log.entity_id}`}`
    }

    if (log.action === 'product_deleted') {
      return `Deleted product: ${details.productName || `#${log.entity_id}`}`
    }

    if (log.action === 'admin_granted') {
      return `Granted admin access to ${details.targetName || 'a user'}`
    }

    if (log.action === 'admin_removed') {
      return `Removed admin access from ${details.targetName || 'a user'}`
    }

    return log.action
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
    setShowAdminPage(false)
    setAdminUsers([])
    setAuditLogs([])
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
        <form
          className="login-card"
          onSubmit={isRegistering ? handleRegister : handleLogin}
        >
          <h1>{isRegistering ? 'Create your account' : 'Welcome back'}</h1>

          <p>
            {isRegistering
              ? 'Create an account to browse products.'
              : 'Sign in to browse products.'}
          </p>

          {isRegistering && (
            <>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </>
          )}

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
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? isRegistering
                ? 'Creating account...'
                : 'Signing in...'
              : isRegistering
                ? 'Create account'
                : 'Sign in'}
          </button>

          <button
            type="button"
            className="auth-mode-button"
            onClick={() => {
              setIsRegistering((current) => !current)
              setError('')
            }}
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </form>
      </main>
    )
  }

  if (showAdminPage && isAdmin) {
    return (
      <main className="products-page">
        <header className="products-header">
          <div>
            <h1>Admin panel</h1>
            <p>Manage administrator access and review activity.</p>
          </div>

          <div className="header-actions">
            <button
              className="back-to-products-button"
              type="button"
              onClick={() => setShowAdminPage(false)}
            >
              Back to products
            </button>

            <button type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        {adminPageLoading && <p>Loading admin data...</p>}

        {adminPageError && (
          <div>
            <p className="error-message">{adminPageError}</p>
            <button type="button" onClick={fetchAdminData}>
              Try again
            </button>
          </div>
        )}

        {!adminPageLoading && !adminPageError && (
          <>
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>User roles</h2>
                  <p>Only admins can add, edit, or delete products.</p>
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {adminUsers.map((managedUser) => (
                      <tr key={managedUser.id}>
                        <td>{managedUser.name}</td>
                        <td>{managedUser.email}</td>
                        <td>
                          <span
                            className={`role-badge role-${managedUser.role}`}
                          >
                            {managedUser.role}
                          </span>
                        </td>
                        <td>
                          {managedUser.is_initial_admin ? (
                            <span className="current-admin-label">
                              Initial admin
                            </span>
                          ) : String(managedUser.id) === String(user.id) ? (
                            <span className="current-admin-label">
                              Current admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={
                                managedUser.role === 'admin'
                                  ? 'remove-admin-button'
                                  : 'make-admin-button'
                              }
                              disabled={
                                String(updatingRoleId) ===
                                String(managedUser.id)
                              }
                              onClick={() =>
                                handleRoleChange(
                                  managedUser,
                                  managedUser.role === 'admin'
                                    ? 'user'
                                    : 'admin'
                                )
                              }
                            >
                              {String(updatingRoleId) ===
                                String(managedUser.id)
                                ? 'Updating...'
                                : managedUser.role === 'admin'
                                  ? 'Remove admin'
                                  : 'Make admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Admin activity</h2>
                  <p>Times are shown in your browser’s local timezone.</p>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <p>No admin actions have been recorded yet.</p>
              ) : (
                <ul className="audit-log-list">
                  {auditLogs.map((log) => (
                    <li className="audit-log-item" key={log.id}>
                      <div>
                        <strong>{log.actor_name}</strong>
                        <p>{describeAuditLog(log)}</p>
                      </div>

                      <time dateTime={log.created_at}>
                        {new Date(log.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short',
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
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

        <div className="header-actions">

          {isAdmin && (
            <button
              className="admin-panel-button"
              type="button"
              onClick={openAdminPage}
            >
              Admin panel
            </button>
          )}

          {isAdmin && (
            <button
              className="add-product-button"
              onClick={openCreateProductForm}
            >
              Add product
            </button>
          )}

          <button onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {showCreateForm && (
        <section className="create-product-panel">
          <div className="create-product-heading">
            <div>
              <h2>Add a product</h2>
              <p>Upload a JPEG, PNG, or WebP image up to 5 MB.</p>
            </div>

            <button
              className="close-form-button"
              type="button"
              onClick={closeCreateProductForm}
            >
              Cancel
            </button>
          </div>

          <form className="create-product-form" onSubmit={handleCreateProduct}>
            <label htmlFor="product-name">Product name</label>
            <input
              id="product-name"
              type="text"
              maxLength="200"
              required
              value={newProduct.name}
              onChange={(event) =>
                setNewProduct({ ...newProduct, name: event.target.value })
              }
              placeholder="Example: Handmade ceramic mug"
            />

            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows="4"
              value={newProduct.description}
              onChange={(event) =>
                setNewProduct({ ...newProduct, description: event.target.value })
              }
              placeholder="Describe the product"
            />

            <label htmlFor="product-price">Price</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={newProduct.price}
              onChange={(event) =>
                setNewProduct({ ...newProduct, price: event.target.value })
              }
              placeholder="0.00"
            />

            <label htmlFor="product-image">Product image</label>
            <input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(event) =>
                setNewProduct({
                  ...newProduct,
                  image: event.target.files?.[0] || null,
                })
              }
            />

            {createProductError && (
              <p className="error-message">{createProductError}</p>
            )}

            <button type="submit" disabled={creatingProduct}>
              {creatingProduct ? 'Creating product...' : 'Create product'}
            </button>
          </form>
        </section>
      )}


      {!selectedProduct && !productDetailLoading && !showCreateForm && (
        <form className="filter-form" onSubmit={applyFilters}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product name"
            aria-label="Search products by name"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Minimum price"
            aria-label="Minimum price"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Maximum price"
            aria-label="Maximum price"
          />

          <button type="submit">Apply filters</button>

          <button
            className="clear-filters-button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>
      )}

      {productsLoading && !selectedProduct && <ProductGridSkeleton />}

      {productsError && (
        <div>
          <p className="error-message">{productsError}</p>
          <button onClick={fetchProducts}>Try again</button>
        </div>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <p>No products match your search or filters.</p>
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
              src={getProductImageUrl(selectedProduct.image_url)}
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
              {isAdmin && (
                <div className="admin-product-actions">
                  <button
                    type="button"
                    className="edit-product-button"
                    onClick={openEditProductForm}
                    disabled={deletingProduct}
                  >
                    Edit product
                  </button>

                  <button
                    type="button"
                    className="delete-product-button"
                    onClick={handleDeleteProduct}
                    disabled={deletingProduct}
                  >
                    {deletingProduct ? 'Deleting...' : 'Delete product'}
                  </button>
                </div>
              )}

              {isAdmin && showEditForm && (
                <form className="edit-product-form" onSubmit={handleUpdateProduct}>
                  <h2>Edit product</h2>

                  <label htmlFor="edit-product-name">Product name</label>
                  <input
                    id="edit-product-name"
                    type="text"
                    maxLength="200"
                    required
                    value={editProduct.name}
                    onChange={(event) =>
                      setEditProduct({ ...editProduct, name: event.target.value })
                    }
                  />

                  <label htmlFor="edit-product-description">Description</label>
                  <textarea
                    id="edit-product-description"
                    rows="4"
                    value={editProduct.description}
                    onChange={(event) =>
                      setEditProduct({
                        ...editProduct,
                        description: event.target.value,
                      })
                    }
                  />

                  <label htmlFor="edit-product-price">Price</label>
                  <input
                    id="edit-product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editProduct.price}
                    onChange={(event) =>
                      setEditProduct({ ...editProduct, price: event.target.value })
                    }
                  />

                  <label htmlFor="edit-product-image">
                    Replace image <span>(optional)</span>
                  </label>
                  <input
                    id="edit-product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setEditProduct({
                        ...editProduct,
                        image: event.target.files?.[0] || null,
                      })
                    }
                  />

                  {editProductError && (
                    <p className="error-message">{editProductError}</p>
                  )}

                  <div className="edit-form-actions">
                    <button type="submit" disabled={updatingProduct}>
                      {updatingProduct ? 'Saving...' : 'Save changes'}
                    </button>

                    <button
                      type="button"
                      className="cancel-edit-button"
                      onClick={closeEditProductForm}
                      disabled={updatingProduct}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
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
                      src={getProductImageUrl(product.image_url)}
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