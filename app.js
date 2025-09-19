let db = {
  users: [{id: 1, username: "qasem", password: "1234", balance: 100, email: "qasem@example.com", addresses: []}],
  restaurants: [
    {id: 1, name: "مطعم الرومانسية", image: "restaurant1.jpg", rating: 4.5, deliveryTime: "30-45 دقيقة", menu: [
      {id: 1, name: "كبسة دجاج", price: 35, description: "أرز مع دجاج وتوابل خاصة"},
      {id: 2, name: "مندي لحم", price: 45, description: "أرز مندي مع لحم ضأن"},
      {id: 3, name: "شاورما", price: 25, description: "شاورما لحم أو دجاج مع خبز وصوص خاص"}
    ]},
    {id: 2, name: "مطعم القرية النجدية", image: "restaurant2.jpg", rating: 4.2, deliveryTime: "40-55 دقيقة", menu: [
      {id: 4, name: "جريش", price: 30, description: "جريش نجدية تقليدية"},
      {id: 5, name: "قرصان", price: 28, description: "قرصان مع مرق اللحم"},
      {id: 6, name: "مفطح", price: 50, description: "مفطح لحم ضأن مع أرز"}
    ]},
  ],
  orders: [],
  transactions: []
};

let currentUser = null;
let cart = [];
let currentRestaurant = null;
let selectedAmount = 0;
let selectedPaymentMethod = "stc";
let rechargeAmount = 0;
let rechargeMethod = "stc";

// حفظ في localStorage
function saveDB() {
  localStorage.setItem("qasem_db", JSON.stringify(db));
  updateCartBadge();
}

function loadDB() {
  let saved = localStorage.getItem("qasem_db");
  if (saved) db = JSON.parse(saved);
  updateCartBadge();
}
loadDB();

function updateCartBadge() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
  }
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  
  document.getElementById(id).classList.add("active");
  const navBtn = document.querySelector(`.nav-btn[onclick="showPage('${id}')"]`);
  if (navBtn) navBtn.classList.add("active");
  
  if (id === "home") renderRestaurants();
  if (id === "orders") renderOrders();
  if (id === "wallet") {
    updateWallet();
    renderTransactions();
    initWalletPage();
  }
  if (id === "login") {
    if (currentUser) {
      document.getElementById("login-form").style.display = "none";
      document.getElementById("register-form").style.display = "none";
      document.getElementById("user-info").style.display = "block";
      document.getElementById("user-name").textContent = currentUser.username;
      document.getElementById("user-email").textContent = currentUser.email || "لا يوجد بريد إلكتروني";
    } else {
      document.getElementById("login-form").style.display = "block";
      document.getElementById("user-info").style.display = "none";
    }
  }
  if (id === "cart") renderCart();
}

function initWalletPage() {
  // تهيئة خيارات المبلغ
  const amountOptions = document.querySelectorAll('.amount-option');
  amountOptions.forEach(option => {
    option.addEventListener('click', () => {
      amountOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedAmount = parseInt(option.getAttribute('data-amount'));
      document.getElementById('custom-amount').value = '';
    });
  });
  
  // تهيئة خيارات الدفع
  const paymentMethods = document.querySelectorAll('.payment-method-wallet');
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
      rechargeMethod = method.getAttribute('data-method');
    });
  });
  
  // التعامل مع الإدخال المخصص
  document.getElementById('custom-amount').addEventListener('input', (e) => {
    amountOptions.forEach(opt => opt.classList.remove('selected'));
    selectedAmount = parseInt(e.target.value) || 0;
  });
}

function showRestaurant(restId) {
  currentRestaurant = db.restaurants.find(r => r.id === restId);
  if (!currentRestaurant) return;
  
  document.getElementById("restaurant-name").textContent = currentRestaurant.name;
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";
  
  currentRestaurant.menu.forEach(item => {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";
    menuItem.innerHTML = `
      <div class="menu-item-info">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-item-price">${item.price} ريال</div>
      </div>
      <button class="add-to-cart-btn" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">إضافة</button>
    `;
    menuList.appendChild(menuItem);
  });
  
  showPage("restaurant");
}

function renderRestaurants() {
  let container = document.getElementById("restaurant-list");
  container.innerHTML = "";
  
  db.restaurants.forEach(restaurant => {
    let card = document.createElement("div");
    card.className = "restaurant-card";
    card.onclick = () => showRestaurant(restaurant.id);
    card.innerHTML = `
      <div class="restaurant-image">
        <img src="${restaurant.image || 'default-restaurant.jpg'}" alt="${restaurant.name}">
        <div class="restaurant-rating">⭐ ${restaurant.rating}</div>
      </div>
      <div class="restaurant-info">
        <h3>${restaurant.name}</h3>
        <p>وقت التوصيل: ${restaurant.deliveryTime}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function addToCart(itemId, itemName, itemPrice) {
  if (!currentRestaurant) return;
  
  const existingItem = cart.find(item => item.id === itemId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: itemId,
      name: itemName,
      price: itemPrice,
      quantity: 1,
      restaurant: currentRestaurant.name
    });
  }
  
  saveDB();
  alert(`تم إضافة ${itemName} إلى السلة`);
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartTax = document.getElementById("cart-tax");
  const cartGrandTotal = document.getElementById("cart-grand-total");
  
  cartItems.innerHTML = "";
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">السلة فارغة</p>';
    cartTotal.textContent = "0 ريال";
    cartTax.textContent = "0 ريال";
    cartGrandTotal.textContent = "0 ريال";
    return;
  }
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>من ${item.restaurant}</p>
        <div class="cart-item-price">${itemTotal} ريال</div>
      </div>
      <div class="cart-item-controls">
        <button onclick="updateCartItem(${index}, ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateCartItem(${index}, ${item.quantity + 1})">+</button>
        <button class="remove-btn" onclick="removeCartItem(${index})">🗑️</button>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });
  
  const tax = total * 0.15;
  const deliveryFee = 15;
  const grandTotal = total + tax + deliveryFee;
  
  cartTotal.textContent = `${total} ريال`;
  cartTax.textContent = `${tax.toFixed(2)} ريال`;
  cartGrandTotal.textContent = `${grandTotal.toFixed(2)} ريال`;
}

function updateCartItem(index, newQuantity) {
  if (newQuantity < 1) {
    removeCartItem(index);
    return;
  }
  
  cart[index].quantity = newQuantity;
  saveDB();
  renderCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveDB();
  renderCart();
}

function proceedToCheckout() {
  if (cart.length === 0) {
    alert("السلة فارغة، أضف عناصر أولاً");
    return;
  }
  
  if (!currentUser) {
    alert("يجب تسجيل الدخول أولاً");
    showPage("login");
    return;
  }
  
  // حساب الإجمالي
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });
  const tax = total * 0.15;
  const deliveryFee = 15;
  const grandTotal = total + tax + deliveryFee;
  
  // التحقق من الرصيد إذا كانت طريقة الدفع بالمحفظة
  if (currentUser.balance < grandTotal && selectedPaymentMethod === "wallet") {
    alert("رصيدك غير كافٍ، يرجى شحن المحفظة أو اختيار طريقة دفع أخرى");
    showPage("wallet");
    return;
  }
  
  // عرض عناصر الطلب في صفحة الدفع
  const checkoutItems = document.getElementById("checkout-items");
  checkoutItems.innerHTML = "";
  
  cart.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "checkout-item";
    itemElement.innerHTML = `
      <span>${item.quantity}x ${item.name}</span>
      <span>${item.price * item.quantity} ريال</span>
    `;
    checkoutItems.appendChild(itemElement);
  });
  
  // عرض الإجمالي
  document.getElementById("checkout-grand-total").textContent = `${grandTotal.toFixed(2)} ريال`;
  
  // تهيئة خيارات الدفع
  initPaymentOptions();
  
  showPage("checkout");
}

function initPaymentOptions() {
  const paymentOptions = document.querySelectorAll('.payment-option');
  paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      paymentOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedPaymentMethod = option.getAttribute('data-method');
      updatePaymentDetails();
    });
  });
  
  updatePaymentDetails();
}

function updatePaymentDetails() {
  const paymentDetails = document.getElementById("payment-details");
  paymentDetails.innerHTML = "";
  
  if (selectedPaymentMethod === "wallet") {
    paymentDetails.innerHTML = `
      <div class="payment-detail">
        <p>سيتم خصم المبلغ من رصيدك في محفظة QASEMPAY</p>
        <p class="wallet-balance-check">الرصيد الحالي: ${currentUser.balance} ريال</p>
      </div>
    `;
  } else if (selectedPaymentMethod === "stc") {
    paymentDetails.innerHTML = `
      <div class="payment-detail">
        <div class="stc-payment-form">
          <input type="tel" placeholder="رقم الجوال المرتبط بـ STC Pay">
          <button class="verify-btn">إرسال رمز التحقق</button>
        </div>
      </div>
    `;
  } else if (selectedPaymentMethod === "card") {
    paymentDetails.innerHTML = `
      <div class="payment-detail">
        <div class="card-payment-form">
          <input type="text" placeholder="رقم البطاقة">
          <div class="card-details">
            <input type="text" placeholder="MM/YY" class="card-expiry">
            <input type="text" placeholder="CVV" class="card-cvv">
          </div>
          <input type="text" placeholder="اسم صاحب البطاقة">
        </div>
      </div>
    `;
  } else if (selectedPaymentMethod === "cash") {
    paymentDetails.innerHTML = `
      <div class="payment-detail">
        <p>سيتم الدفع نقداً عند استلام الطلب</p>
      </div>
    `;
  }
}

function confirmPayment() {
  // حساب الإجمالي
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });
  const tax = total * 0.15;
  const deliveryFee = 15;
  const grandTotal = total + tax + deliveryFee;
  
  if (selectedPaymentMethod === "wallet") {
    // خصم المبلغ من المحفظة
    currentUser.balance -= grandTotal;
    
    // إضافة معاملة
    const transaction = {
      id: Date.now(),
      userId: currentUser.id,
      type: "debit",
      amount: grandTotal,
      description: `طلب من ${cart[0].restaurant}`,
      date: new Date().toLocaleString('ar-SA')
    };
    
    db.transactions.push(transaction);
  }
  
  // إنشاء الطلب
  const order = {
    id: Date.now(),
    userId: currentUser.id,
    items: [...cart],
    total: grandTotal,
    date: new Date().toLocaleString('ar-SA'),
    status: "قيد التجهيز",
    restaurant: cart[0].restaurant,
    paymentMethod: selectedPaymentMethod
  };
  
  db.orders.push(order);
  
  // تفريغ السلة
  cart = [];
  saveDB();
  
  alert(`تم تأكيد الطلب بنجاح! رقم الطلب: ${order.id}`);
  showPage("orders");
}

function initiateRecharge() {
  if (!currentUser) {
    alert("يجب تسجيل الدخول أولاً");
    showPage("login");
    return;
  }
  
  // الحصول على المبلغ المحدد
  const customAmount = parseInt(document.getElementById('custom-amount').value);
  if (customAmount > 0) {
    rechargeAmount = customAmount;
  } else if (selectedAmount > 0) {
    rechargeAmount = selectedAmount;
  } else {
    alert("يرجى تحديد مبلغ الشحن");
    return;
  }
  
  // عرض نافذة التأكيد
  document.getElementById('confirm-amount').textContent = rechargeAmount;
  document.getElementById('confirm-method').textContent = 
    rechargeMethod === "stc" ? "STC Pay" : "بطاقة ائتمان";
  
  document.getElementById('confirmation-modal').style.display = 'block';
}

function confirmRecharge() {
  // زيادة الرصيد
  currentUser.balance += rechargeAmount;
  
  // إضافة معاملة
  const transaction = {
    id: Date.now(),
    userId: currentUser.id,
    type: "credit",
    amount: rechargeAmount,
    description: `شحن محفظة - ${rechargeMethod === "stc" ? "STC Pay" : "بطاقة ائتمان"}`,
    date: new Date().toLocaleString('ar-SA')
  };
  
  db.transactions.push(transaction);
  saveDB();
  
  // إغلاق النافذة
  closeModal();
  
  // تحديث الواجهة
  updateWallet();
  renderTransactions();
  
  alert(`تم شحن ${rechargeAmount} ريال إلى محفظتك بنجاح!`);
}

function closeModal() {
  document.getElementById('confirmation-modal').style.display = 'none';
}

function renderOrders() {
  let container = document.getElementById("orders-list");
  container.innerHTML = "";
  
  const userOrders = db.orders.filter(order => 
    currentUser ? order.userId === currentUser.id : order.user === "زائر"
  );
  
  if (userOrders.length === 0) {
    container.innerHTML = '<p class="empty-orders">لا توجد طلبات سابقة</p>';
    return;
  }
  
  userOrders.forEach(order => {
    let orderCard = document.createElement("div");
    orderCard.className = "order-card";
    orderCard.innerHTML = `
      <div class="order-header">
        <div class="order-info">
          <h3>طلب من ${order.restaurant}</h3>
          <p>رقم الطلب: #${order.id}</p>
        </div>
        <div class="order-status ${order.status === 'مكتمل' ? 'completed' : 'pending'}">
          ${order.status}
        </div>
      </div>
      <div class="order-details">
        <p>التاريخ: ${order.date}</p>
        <p>الإجمالي: ${order.total.toFixed(2)} ريال</p>
        <p>طريقة الدفع: ${getPaymentMethodName(order.paymentMethod)}</p>
      </div>
      <div class="order-items">
        ${order.items.map(item => `
          <div class="order-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>${item.price * item.quantity} ريال</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(orderCard);
  });
}

function getPaymentMethodName(method) {
  switch(method) {
    case "wallet": return "المحفظة";
    case "stc": return "STC Pay";
    case "card": return "بطاقة ائتمان";
    case "cash": return "نقداً عند الاستلام";
    default: return method;
  }
}

function login() {
  let u = document.getElementById("username").value;
  let p = document.getElementById("password").value;
  let user = db.users.find(x => x.username === u && x.password === p);
  
  if (user) {
    currentUser = user;
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "none";
    document.getElementById("user-info").style.display = "block";
    document.getElementById("user-name").textContent = currentUser.username;
    document.getElementById("user-email").textContent = currentUser.email || "لا يوجد بريد إلكتروني";
    alert(`مرحباً مرة أخرى، ${currentUser.username}`);
  } else {
    alert("بيانات الدخول غير صحيحة");
  }
}

function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

function register() {
  const username = document.getElementById("new-username").value;
  const password = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  
  if (!username || !password) {
    alert("يرجى ملء جميع الحقول");
    return;
  }
  
  if (password !== confirmPassword) {
    alert("كلمة المرور غير متطابقة");
    return;
  }
  
  if (db.users.some(user => user.username === username)) {
    alert("اسم المستخدم موجود مسبقاً");
    return;
  }
  
  const newUser = {
    id: Date.now(),
    username,
    password,
    balance: 0,
    email: "",
    addresses: []
  };
  
  db.users.push(newUser);
  saveDB();
  currentUser = newUser;
  
  alert(`تم إنشاء الحساب بنجاح، مرحباً ${username}`);
  showPage("login");
}

function logout() {
  currentUser = null;
  document.getElementById("login-form").style.display = "block";
  document.getElementById("user-info").style.display = "none";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function updateWallet() {
  if (currentUser) {
    document.getElementById("wallet-balance").textContent = `${currentUser.balance} ريال`;
  } else {
    document.getElementById("wallet-balance").textContent = "0 ريال";
  }
}

function renderTransactions() {
  const transactionList = document.getElementById("transaction-list");
  transactionList.innerHTML = "";
  
  if (!currentUser) {
    transactionList.innerHTML = '<p class="empty-transactions">يجب تسجيل الدخول لعرض المعاملات</p>';
    return;
  }
  
  const userTransactions = db.transactions.filter(t => t.userId === currentUser.id);
  
  if (userTransactions.length === 0) {
    transactionList.innerHTML = '<p class="empty-transactions">لا توجد معاملات سابقة</p>';
    return;
  }
  
  userTransactions.forEach(transaction => {
    const transactionItem = document.createElement("div");
    transactionItem.className = `transaction-item ${transaction.type}`;
    transactionItem.innerHTML = `
      <div class="transaction-info">
        <h4>${transaction.description}</h4>
        <p>${transaction.date}</p>
      </div>
      <div class="transaction-amount ${transaction.type}">
        ${transaction.type === 'credit' ? '+' : '-'} ${transaction.amount} ريال
      </div>
    `;
    transactionList.appendChild(transactionItem);
  });
}

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
  const modal = document.getElementById('confirmation-modal');
  if (event.target == modal) {
    closeModal();
  }
}
