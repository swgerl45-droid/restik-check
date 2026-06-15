<template>
  <div style="display: flex; min-height: 100vh; font-family: sans-serif;">
    
    <!-- ЭКРАН ВХОДА -->
    <template v-if="!loggedIn">
      <div style="max-width: 400px; margin: 100px auto; padding: 30px; background: #f5f5f5; border-radius: 12px; width: 100%;">
        <h1 style="color: #ff6b35; text-align: center;">Restik Check</h1>
        <h3 style="text-align: center; color: #666;">Вход в систему</h3>
        <input v-model="loginForm.login" placeholder="Логин" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;" />
        <input v-model="loginForm.password" type="password" placeholder="Пароль" @keyup.enter="doLogin" style="width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px;" />
        <button @click="doLogin" :disabled="loginLoading" style="width: 100%; padding: 14px; background: #ff6b35; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">{{ loginLoading ? 'Входим...' : 'Войти' }}</button>
        <p v-if="loginError" style="color: #e74c3c; margin-top: 15px; text-align: center;">{{ loginError }}</p>
      </div>
    </template>

    <!-- ОСНОВНОЕ ПРИЛОЖЕНИЕ -->
    <template v-else>
      <div style="width: 260px; background: #1a1a1a; color: white; padding: 20px 0; min-height: 100vh; flex-shrink: 0; position: relative;">
        <div style="padding: 0 20px 20px; border-bottom: 1px solid #333; margin-bottom: 20px;">
          <h2 style="color: #ff6b35; margin: 0;">Restik Check</h2>
          <p style="color: #999; font-size: 14px; margin: 5px 0 0;">{{ currentUser?.full_name }}</p>
          <p style="color: #666; font-size: 12px; margin: 2px 0 0;">{{ currentUserRole?.label }}</p>
        </div>
        <div v-if="hasAccess('backoffice.access')" style="margin-bottom: 20px;">
          <div style="padding: 8px 20px; color: #ff6b35; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Бэк-офис</div>
          <div v-if="hasAccess('roles.manage')" @click="page = 'roles'" :style="menuItemStyle('roles')">🔑 Роли и права</div>
          <div v-if="hasAccess('users.manage')" @click="page = 'users'" :style="menuItemStyle('users')">👥 Пользователи</div>
          <div v-if="hasAccess('templates.manage')" @click="page = 'templates'" :style="menuItemStyle('templates')">📋 Шаблоны чек-листов</div>
          <div v-if="hasAccess('settings.manage')" @click="page = 'settings'" :style="menuItemStyle('settings')">⚙️ Настройки</div>
        </div>
        <div>
          <div style="padding: 8px 20px; color: #ff6b35; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Фронт-офис</div>
          <div v-if="hasAccess('checklists.view')" @click="page = 'mytasks'" :style="menuItemStyle('mytasks')">✅ Чек-листы</div>
          <div v-if="hasAccess('bookings.view')" @click="page = 'bookings'" :style="menuItemStyle('bookings')">📅 Брони</div>
          <div v-if="hasAccess('dashboard.view')" @click="page = 'dashboard'" :style="menuItemStyle('dashboard')">📊 Дашборд</div>
          <div v-if="hasAccess('journals.view')" @click="page = 'journals'" :style="menuItemStyle('journals')">📒 Журналы</div>
          <div v-if="hasAccess('schedule.view')" @click="page = 'schedule'" :style="menuItemStyle('schedule')">📆 График</div>
          <div v-if="hasAccess('timesheet.view')" @click="page = 'timesheet'" :style="menuItemStyle('timesheet')">⏱ Табель</div>
        </div>
        <button @click="logout" style="position: absolute; bottom: 20px; left: 20px; background: none; border: 1px solid #e74c3c; color: #e74c3c; padding: 8px 20px; border-radius: 6px; cursor: pointer;">Выйти</button>
      </div>

      <div style="flex: 1; padding: 30px; background: #f9f9f9; min-height: 100vh;">

        <!-- БРОНИ -->
        <template v-if="page === 'bookings'">
          <h2>📅 Брони</h2>
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
            <button @click="changeDate(-1)" style="padding: 8px 12px; background: #2196f3; color: white; border: none; border-radius: 6px;">←</button>
            <input type="date" v-model="selectedDate" @change="loadBookings" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />
            <button @click="changeDate(1)" style="padding: 8px 12px; background: #2196f3; color: white; border: none; border-radius: 6px;">→</button>
            <button @click="selectedDate = new Date().toISOString().split('T')[0]; loadBookings()" style="padding: 8px 12px; background: #ff6b35; color: white; border: none; border-radius: 6px;">Сегодня</button>
            <span v-if="bookingsLoading" style="color: #999;">Загрузка...</span>
            <span v-else style="font-weight: bold; margin-left: auto;">{{ bookings.length }} броней</span>
          </div>
          <button @click="showBookingForm = true" style="padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 8px; font-size: 16px; margin-bottom: 20px;">+ Новая бронь</button>
          
          <div v-if="showBookingForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3>Новая бронь</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div><label style="font-weight: bold;">Имя *</label><input v-model="bookingForm.guest_name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></div>
              <div><label style="font-weight: bold;">Телефон</label><input v-model="bookingForm.guest_phone" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></div>
              <div><label style="font-weight: bold;">Дата *</label><input type="date" v-model="bookingForm.booking_date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></div>
              <div><label style="font-weight: bold;">Время *</label><input type="time" v-model="bookingForm.booking_time" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></div>
              <div><label style="font-weight: bold;">Гостей *</label><input type="number" v-model.number="bookingForm.guests_count" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" /></div>
              <div><label style="font-weight: bold;">Столик</label><select v-model="bookingForm.table_id" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;"><option value="">-- Выбери --</option><option v-for="t in tables" :key="t.id" :value="t.id">Стол {{ t.number }} ({{ t.seats }} мест)</option></select></div>
              <div style="grid-column: 1 / -1;"><label style="font-weight: bold;">Примечания</label><textarea v-model="bookingForm.notes" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" rows="2"></textarea></div>
            </div>
            <button @click="createBooking" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px; margin-top: 15px;">Создать</button>
            <button @click="showBookingForm = false" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
          </div>

          <div v-if="!bookingsLoading && bookings.length === 0" style="color: #999; text-align: center; padding: 40px;">Нет броней</div>
          <div v-for="b in sortedBookings" :key="b.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid;" :style="{ borderColor: statusColor(b.status) }">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div><strong>{{ b.guest_name }}</strong><span style="color: #666; margin-left: 10px;">{{ b.guests_count }} чел.</span><span v-if="b.table" style="color: #2196f3; margin-left: 10px;">Стол {{ b.table.number }}</span></div>
              <div style="text-align: right;"><strong>{{ b.booking_time?.substring(0, 5) }}</strong><br/><select v-model="b.status" @change="updateBookingStatus(b)" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; margin-top: 5px;"><option value="pending">Ожидает</option><option value="confirmed">Подтверждено</option><option value="arrived">Пришёл</option><option value="completed">Завершено</option><option value="cancelled">Отмена</option></select></div>
            </div>
            <div v-if="b.guest_phone || b.notes" style="margin-top: 8px; color: #999; font-size: 14px;"><span v-if="b.guest_phone">📞 {{ b.guest_phone }}</span><span v-if="b.notes" style="margin-left: 10px;">💬 {{ b.notes }}</span></div>
          </div>
        </template>

        <!-- РОЛИ -->
        <template v-if="page === 'roles'">
          <h2>Роли и права</h2>
          <button @click="showRoleForm = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Новая роль</button>
          <div v-if="showRoleForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <input v-model="roleForm.code" placeholder="Код" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" :disabled="editingRoleId !== null" />
            <input v-model="roleForm.label" placeholder="Название" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <h4>Права:</h4>
            <div v-for="perm in allPermissions" :key="perm.code" style="margin-bottom: 5px;"><label><input type="checkbox" :value="perm.code" v-model="roleForm.permissions" /> {{ perm.label }}</label></div>
            <button @click="saveRole" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px; margin-top: 10px;">{{ editingRoleId ? 'Обновить' : 'Создать' }}</button>
            <button @click="cancelRoleForm" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
          </div>
          <div v-for="role in allRoles" :key="role.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between;">
            <div><strong>{{ role.label }}</strong> <span style="color: #999;">({{ role.code }})</span><div style="margin-top: 5px;"><span v-for="p in role.permissions" :key="p" style="background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px;">{{ p }}</span></div></div>
            <div><button @click="editRole(role)" style="padding: 6px 12px; background: #2196f3; color: white; border: none; border-radius: 4px; margin-right: 5px;">Ред.</button><button v-if="role.code !== 'admin'" @click="deleteRole(role.id)" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px;">Уд.</button></div>
          </div>
        </template>

        <!-- ПОЛЬЗОВАТЕЛИ -->
        <template v-if="page === 'users'">
          <h2>Пользователи</h2>
          <button @click="showUserForm = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Добавить</button>
          <div v-if="showUserForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3>{{ editingUserId ? 'Редактировать' : 'Новый пользователь' }}</h3>
            <input v-model="userForm.full_name" placeholder="ФИО" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <input v-model="userForm.email" placeholder="Email" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <input v-model="userForm.login" placeholder="Логин" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" :disabled="editingUserId !== null" />
            <input v-model="userForm.password" placeholder="Пароль" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <select v-model="userForm.role_id" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;"><option value="">-- Роль --</option><option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.label }}</option></select>
            <button @click="saveUser" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px;">{{ editingUserId ? 'Обновить' : 'Создать' }}</button>
            <button @click="cancelUserForm" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
          </div>
          <div v-for="user in users" :key="user.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div><strong>{{ user.full_name }}</strong><br/><span style="color: #999;">{{ user.login }} | {{ getRoleLabel(user.role_id) }}</span></div>
            <div><select :value="user.role_id" @change="updateUserRole(user.id, $event.target.value)" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; margin-right: 8px;"><option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.label }}</option></select><button @click="editUser(user)" style="padding: 6px 12px; background: #2196f3; color: white; border: none; border-radius: 4px; margin-right: 5px;">Ред.</button><button @click="deleteUser(user.id)" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px;">Уд.</button></div>
          </div>
        </template>

        <!-- ЗАГЛУШКИ -->
        <template v-if="['templates', 'mytasks', 'dashboard', 'journals', 'schedule', 'timesheet', 'settings'].includes(page)">
          <h2>{{ pageTitle(page) }}</h2><p style="color: #999;">Раздел скоро появится.</p>
        </template>

      </div>
    </template>
  </div>
</template>

<script setup>
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nbhurdasbscmkjssxsbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaHVyZGFzYnNjbWtqc3N4c2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTYyMDIsImV4cCI6MjA5NzAzMjIwMn0.RiBfNJZB8nkDxp71lko4iQH07zE7shQul2TIcOA5_3g'
)

// --- Авторизация ---
const loggedIn = ref(false)
const currentUser = ref(null)
const currentUserRole = ref(null)
const loginForm = ref({ login: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')
const dataLoaded = ref(false)

if (process.client) {
  const saved = localStorage.getItem('restik_user')
  if (saved) { currentUser.value = JSON.parse(saved); loggedIn.value = true }
}

const doLogin = async () => {
  loginLoading.value = true; loginError.value = ''
  const { data } = await supabase.from('profiles').select('*').eq('login', loginForm.value.login).eq('password_hash', loginForm.value.password).single()
  if (data) { currentUser.value = data; loggedIn.value = true; localStorage.setItem('restik_user', JSON.stringify(data)); await loadAll() }
  else loginError.value = 'Неверный логин или пароль'
  loginLoading.value = false
}

const logout = () => { loggedIn.value = false; currentUser.value = null; currentUserRole.value = null; localStorage.removeItem('restik_user'); dataLoaded.value = false; page.value = 'bookings' }
const hasAccess = (perm) => {
  if (!currentUserRole.value) return false
  if (currentUserRole.value.code === 'admin') return true
  return currentUserRole.value.permissions?.includes(perm)
}

// --- Кэшированные данные (загружаются 1 раз) ---
const page = ref('bookings')
const allRoles = ref([])
const allPermissions = ref([])
const users = ref([])
const tables = ref([])
const bookings = ref([])
const bookingsLoading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])

const showRoleForm = ref(false)
const editingRoleId = ref(null)
const roleForm = ref({ code: '', label: '', permissions: [] })

const showUserForm = ref(false)
const editingUserId = ref(null)
const userForm = ref({ full_name: '', email: '', login: '', password: '', role_id: '' })

const showBookingForm = ref(false)
const bookingForm = ref({ guest_name: '', guest_phone: '', booking_date: '', booking_time: '19:00', guests_count: 2, table_id: '', notes: '' })

// --- Вспомогательные ---
const menuItemStyle = (tab) => ({ padding: '10px 20px', cursor: 'pointer', background: page.value === tab ? '#333' : 'transparent', color: page.value === tab ? '#ff6b35' : '#ccc', borderLeft: page.value === tab ? '3px solid #ff6b35' : '3px solid transparent' })
const getRoleLabel = (rid) => (allRoles.value.find(r => r.id === rid) || {}).label || '—'
const statusColor = (s) => ({ pending: '#ff9800', confirmed: '#2196f3', arrived: '#4caf50', completed: '#9e9e9e', cancelled: '#e74c3c' }[s] || '#999')
const pageTitle = (p) => ({ templates: 'Шаблоны чек-листов', mytasks: 'Чек-листы', dashboard: 'Дашборд', journals: 'Журналы', schedule: 'График смен', timesheet: 'Табель', settings: 'Настройки' }[p] || p)
const sortedBookings = computed(() => [...bookings.value].sort((a, b) => (a.booking_time || '').localeCompare(b.booking_time || '')))

// --- Загрузка ВСЕХ данных ОДНИМ залпом ---
const loadAll = async () => {
  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from('roles').select('*'),
    supabase.from('permissions').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('tables').select('*')
  ])
  if (r1.data) allRoles.value = r1.data
  if (r2.data) allPermissions.value = r2.data
  if (r3.data) users.value = r3.data
  if (r4.data) tables.value = r4.data
  if (currentUser.value) currentUserRole.value = allRoles.value.find(r => r.id === currentUser.value.role_id) || null
  dataLoaded.value = true
  bookingForm.value.booking_date = selectedDate.value
  await loadBookings()
}

// --- Брони (единственный динамический запрос) ---
const loadBookings = async () => {
  bookingsLoading.value = true
  const { data } = await supabase.from('bookings').select('*, table:table_id(*)').eq('booking_date', selectedDate.value).order('booking_time')
  if (data) bookings.value = data
  bookingsLoading.value = false
}

const createBooking = async () => {
  if (!bookingForm.value.guest_name || !bookingForm.value.booking_time || !bookingForm.value.guests_count) return alert('Заполни обязательные поля')
  await supabase.from('bookings').insert({ ...bookingForm.value, created_by: currentUser.value.id })
  showBookingForm.value = false
  bookingForm.value = { guest_name: '', guest_phone: '', booking_date: selectedDate.value, booking_time: '19:00', guests_count: 2, table_id: '', notes: '' }
  await loadBookings()
}

const updateBookingStatus = async (b) => {
  await supabase.from('bookings').update({ status: b.status }).eq('id', b.id)
}

const changeDate = (days) => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + days)
  selectedDate.value = d.toISOString().split('T')[0]
  loadBookings()
}

// --- Роли ---
const saveRole = async () => { if (!roleForm.value.code || !roleForm.value.label) return alert('Заполни'); if (editingRoleId.value) await supabase.from('roles').update({ label: roleForm.value.label, permissions: roleForm.value.permissions }).eq('id', editingRoleId.value); else await supabase.from('roles').insert(roleForm.value); cancelRoleForm(); await loadAll() }
const editRole = (r) => { editingRoleId.value = r.id; roleForm.value = { code: r.code, label: r.label, permissions: [...r.permissions] }; showRoleForm.value = true }
const cancelRoleForm = () => { showRoleForm.value = false; editingRoleId.value = null; roleForm.value = { code: '', label: '', permissions: [] } }
const deleteRole = async (id) => { if (confirm('Удалить?')) { await supabase.from('roles').delete().eq('id', id); await loadAll() } }

// --- Пользователи ---
const saveUser = async () => { if (!userForm.value.full_name || !userForm.value.login || !userForm.value.password || !userForm.value.role_id) return alert('Заполни все поля'); if (editingUserId.value) { const upd = { full_name: userForm.value.full_name, email: userForm.value.email, role_id: userForm.value.role_id }; if (userForm.value.password) upd.password_hash = userForm.value.password; await supabase.from('profiles').update(upd).eq('id', editingUserId.value) } else { const { error } = await supabase.from('profiles').insert({ full_name: userForm.value.full_name, email: userForm.value.email, login: userForm.value.login, password_hash: userForm.value.password, role_id: userForm.value.role_id }); if (error) { if (error.code === '23505') return alert('Логин занят'); return alert('Ошибка: ' + error.message) } }; cancelUserForm(); await loadAll() }
const editUser = (u) => { editingUserId.value = u.id; userForm.value = { full_name: u.full_name, email: u.email || '', login: u.login || '', password: '', role_id: u.role_id }; showUserForm.value = true }
const cancelUserForm = () => { showUserForm.value = false; editingUserId.value = null; userForm.value = { full_name: '', email: '', login: '', password: '', role_id: '' } }
const deleteUser = async (id) => { if (confirm('Удалить?')) { await supabase.from('profiles').delete().eq('id', id); await loadAll() } }
const updateUserRole = async (uid, rid) => { await supabase.from('profiles').update({ role_id: rid }).eq('id', uid); await loadAll() }

// Загружаем всё при старте (если уже залогинен)
if (loggedIn.value) loadAll()
</script>