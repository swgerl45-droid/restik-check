<template>
  <div style="display: flex; min-height: 100vh; font-family: sans-serif;">
    
    <!-- ==================== ЭКРАН ВХОДА ==================== -->
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

    <!-- ==================== ОСНОВНОЕ ПРИЛОЖЕНИЕ ==================== -->
    <template v-else>
      <!-- Боковое меню -->
      <div style="width: 260px; background: #1a1a1a; color: white; padding: 20px 0; min-height: 100vh; flex-shrink: 0;">
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
          <div v-if="hasAccess('journals.configure')" @click="page = 'journal_templates'" :style="menuItemStyle('journal_templates')">📒 Шаблоны журналов</div>
          <div v-if="hasAccess('settings.manage')" @click="page = 'settings'" :style="menuItemStyle('settings')">⚙️ Настройки</div>
        </div>

        <div>
          <div style="padding: 8px 20px; color: #ff6b35; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Фронт-офис</div>
          <div v-if="hasAccess('checklists.view')" @click="page = 'mytasks'" :style="menuItemStyle('mytasks')">✅ Чек-листы</div>
          <div v-if="hasAccess('bookings.view')" @click="page = 'bookings'" :style="menuItemStyle('bookings')">📅 Брони</div>
          <div v-if="hasAccess('dashboard.view')" @click="page = 'dashboard'" :style="menuItemStyle('dashboard')">📊 Дашборд</div>
          <div v-if="hasAccess('journals.view')" @click="page = 'journals'" :style="menuItemStyle('journals')">📒 Журналы СанПина</div>
          <div v-if="hasAccess('schedule.view')" @click="page = 'schedule'" :style="menuItemStyle('schedule')">📆 График смен</div>
          <div v-if="hasAccess('timesheet.view')" @click="page = 'timesheet'" :style="menuItemStyle('timesheet')">⏱ Табель</div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 20px;">
          <button @click="logout" style="background: none; border: 1px solid #e74c3c; color: #e74c3c; padding: 8px 20px; border-radius: 6px; cursor: pointer;">Выйти</button>
        </div>
      </div>

      <!-- Основной контент -->
      <div style="flex: 1; padding: 30px; background: #f9f9f9; min-height: 100vh;">

        <!-- ==================== ЖУРНАЛЫ: ШАБЛОНЫ ==================== -->
        <template v-if="page === 'journal_templates'">
          <h2>Шаблоны журналов СанПина</h2>
          <button @click="showJournalTemplateForm = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Новый шаблон журнала</button>
          
          <!-- Форма шаблона -->
          <div v-if="showJournalTemplateForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3>{{ editingJournalTemplateId ? 'Редактировать шаблон' : 'Новый шаблон журнала' }}</h3>
            <input v-model="journalTemplateForm.name" placeholder="Название (например: Журнал температуры холодильников)" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <input v-model="journalTemplateForm.description" placeholder="Описание" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            
            <h4>Поля журнала:</h4>
            <div v-for="(field, i) in journalTemplateForm.fields" :key="i" style="background: #f9f9f9; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <input v-model="field.label" placeholder="Название поля" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" />
              <select v-model="field.type" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="text">Текст</option>
                <option value="number">Число</option>
                <option value="select">Выбор</option>
              </select>
              <input v-if="field.type === 'select'" v-model="field.options" placeholder="Варианты через запятую" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" />
              <input v-if="field.type === 'number'" v-model="field.unit" placeholder="Ед. изм (°C)" style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" />
              <button @click="journalTemplateForm.fields.splice(i, 1)" style="background: #e74c3c; color: white; border: none; border-radius: 4px; padding: 4px 8px;">✕</button>
            </div>
            <button @click="journalTemplateForm.fields.push({ label: '', type: 'text', unit: '', options: '' })" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 6px; margin-bottom: 15px;">+ Добавить поле</button>
            
            <div>
              <button @click="saveJournalTemplate" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px;">{{ editingJournalTemplateId ? 'Обновить' : 'Создать' }}</button>
              <button @click="cancelJournalTemplateForm" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
            </div>
          </div>

          <!-- Список шаблонов -->
          <div v-for="jt in journalTemplates" :key="jt.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>{{ jt.name }}</strong>
              <span style="color: #999; margin-left: 8px;">{{ jt.fields?.length || 0 }} полей</span>
            </div>
            <div>
              <button @click="editJournalTemplate(jt)" style="padding: 6px 12px; background: #2196f3; color: white; border: none; border-radius: 4px; margin-right: 5px;">Ред.</button>
              <button @click="deleteJournalTemplate(jt.id)" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px;">Уд.</button>
            </div>
          </div>
        </template>

        <!-- ==================== ЖУРНАЛЫ: ЗАПОЛНЕНИЕ ==================== -->
        <template v-if="page === 'journals'">
          <h2>Журналы СанПина</h2>
          
          <div v-if="!activeJournal" style="margin-bottom: 20px;">
            <h3>Выбери журнал для заполнения:</h3>
            <div v-for="jt in journalTemplates" :key="jt.id" @click="openJournal(jt)" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
              <strong>{{ jt.name }}</strong><br/>
              <span style="color: #666; font-size: 14px;">{{ jt.description }}</span>
            </div>
          </div>

          <!-- Форма заполнения -->
          <div v-if="activeJournal" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <button @click="activeJournal = null" style="padding: 8px 16px; background: #999; color: white; border: none; border-radius: 6px; margin-bottom: 20px;">← К списку</button>
            <h3>{{ activeJournal.name }}</h3>
            <p style="color: #666;">{{ activeJournal.description }}</p>
            <p style="color: #999;">Дата: {{ new Date().toLocaleString('ru-RU') }}</p>

            <div v-for="(field, i) in activeJournal.fields" :key="i" style="margin-bottom: 15px;">
              <label style="font-weight: bold; display: block; margin-bottom: 5px;">{{ field.label }} <span v-if="field.unit">({{ field.unit }})</span></label>
              <input v-if="field.type === 'text'" v-model="journalValues[i]" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />
              <input v-if="field.type === 'number'" v-model.number="journalValues[i]" type="number" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />
              <select v-if="field.type === 'select'" v-model="journalValues[i]" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">-- Выбери --</option>
                <option v-for="opt in (field.options || '').split(',').map(o => o.trim())" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div style="margin-top: 15px;">
              <label style="font-weight: bold;">Примечания:</label>
              <textarea v-model="journalNotes" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; min-height: 60px;"></textarea>
            </div>

            <button @click="submitJournal" style="width: 100%; padding: 14px; background: #4caf50; color: white; border: none; border-radius: 8px; margin-top: 15px; font-size: 16px;">Сохранить запись</button>

            <!-- История записей -->
            <h3 style="margin-top: 30px;">Последние записи:</h3>
            <div v-for="entry in journalEntries" :key="entry.id" style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>{{ formatDate(entry.created_at) }}</strong> — {{ getUserName(entry.user_id) }}
              <div style="color: #666; font-size: 14px;">
                <span v-for="(field, i) in activeJournal.fields" :key="i">{{ field.label }}: {{ entry.values[field.label] || '—' }}<span v-if="i < activeJournal.fields.length - 1"> | </span></span>
              </div>
              <div v-if="entry.notes" style="color: #999; font-size: 13px;">{{ entry.notes }}</div>
            </div>
          </div>
        </template>

        <!-- ==================== ОСТАЛЬНЫЕ СТРАНИЦЫ (без изменений) ==================== -->
        <!-- РОЛИ -->
        <template v-if="page === 'roles'">
          <h2>Роли и права</h2>
          <button @click="showRoleForm = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Новая роль</button>
          <div v-if="showRoleForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <input v-model="roleForm.code" placeholder="Код (лат.)" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" :disabled="editingRoleId !== null" />
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
          <button @click="showUserForm = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Добавить пользователя</button>
          <div v-if="showUserForm" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3>{{ editingUserId ? 'Редактировать' : 'Новый пользователь' }}</h3>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">ФИО</label>
            <input v-model="userForm.full_name" placeholder="Иван Петров" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;" />
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email</label>
            <input v-model="userForm.email" type="email" placeholder="ivan@restik.ru" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;" />
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Логин</label>
            <input v-model="userForm.login" placeholder="ivan" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;" :disabled="editingUserId !== null" />
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Пароль</label>
            <input v-model="userForm.password" type="text" placeholder="Пароль" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;" />
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Роль</label>
            <select v-model="userForm.role_id" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px;"><option value="">-- Выбери роль --</option><option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.label }}</option></select>
            <button @click="saveUser" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px;">{{ editingUserId ? 'Обновить' : 'Создать' }}</button>
            <button @click="cancelUserForm" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
          </div>
          <div v-for="user in users" :key="user.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div><strong>{{ user.full_name }}</strong><span style="color: #666; margin-left: 8px;">{{ user.email }}</span><br/><span style="color: #999;">Логин: {{ user.login || '—' }}</span><span style="color: #999; margin-left: 10px;">Роль: {{ getRoleLabel(user.role_id) }}</span></div>
            <div><select :value="user.role_id" @change="updateUserRole(user.id, $event.target.value)" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; margin-right: 8px;"><option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.label }}</option></select><button @click="editUser(user)" style="padding: 6px 12px; background: #2196f3; color: white; border: none; border-radius: 4px; margin-right: 5px;">Ред.</button><button @click="deleteUser(user.id)" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px;">Уд.</button></div>
          </div>
        </template>

        <!-- ШАБЛОНЫ ЧЕК-ЛИСТОВ и остальное (как раньше) -->
        <template v-if="page === 'templates'">
          <h2>Шаблоны чек-листов</h2>
          <button @click="showCreate = true" style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 8px; margin-bottom: 20px;">+ Новый шаблон</button>
          <div v-if="showCreate" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <input v-model="newName" placeholder="Название" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;" />
            <select v-model="newRoleTarget" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;"><option value="">Выбери роль</option><option v-for="r in allRoles" :key="r.code" :value="r.code">{{ r.label }}</option></select>
            <button @click="createTemplate" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; margin-right: 10px;">Сохранить</button>
            <button @click="showCreate = false" style="padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px;">Отмена</button>
          </div>
          <div v-for="t in templates" :key="t.id" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; cursor: pointer;" @click="openEditor(t)"><div><strong>{{ t.name }}</strong> <span style="color: #666;">({{ t.role_target }})</span></div><span style="color: #999;">{{ t.items?.length || 0 }} пунктов</span></div>
        </template>

        <!-- ЗАГЛУШКИ -->
        <template v-if="['bookings', 'dashboard', 'schedule', 'timesheet', 'settings'].includes(page)">
          <h2>{{ pageTitle(page) }}</h2><p style="color: #999;">Раздел в разработке.</p>
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

const loggedIn = ref(false)
const currentUser = ref(null)
const currentUserRole = ref(null)
const loginForm = ref({ login: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')

if (process.client) {
  const saved = localStorage.getItem('restik_user')
  if (saved) { currentUser.value = JSON.parse(saved); loggedIn.value = true }
}

const doLogin = async () => {
  loginLoading.value = true; loginError.value = ''
  const { data } = await supabase.from('profiles').select('*').eq('login', loginForm.value.login).eq('password_hash', loginForm.value.password).single()
  if (data) { currentUser.value = data; loggedIn.value = true; localStorage.setItem('restik_user', JSON.stringify(data)); loadAll() }
  else loginError.value = 'Неверный логин или пароль'
  loginLoading.value = false
}

const logout = () => { loggedIn.value = false; currentUser.value = null; currentUserRole.value = null; localStorage.removeItem('restik_user'); page.value = 'templates' }
const hasAccess = (perm) => {
  if (!currentUserRole.value) return false
  if (currentUserRole.value.code === 'admin') return true
  return currentUserRole.value.permissions?.includes(perm)
}

const page = ref('templates')
const allRoles = ref([])
const allPermissions = ref([])
const users = ref([])
const templates = ref([])

// Роли
const showRoleForm = ref(false)
const editingRoleId = ref(null)
const roleForm = ref({ code: '', label: '', permissions: [] })

// Пользователи
const showUserForm = ref(false)
const editingUserId = ref(null)
const userForm = ref({ full_name: '', email: '', login: '', password: '', role_id: '' })

// Шаблоны чек-листов
const showCreate = ref(false)
const newName = ref('')
const newRoleTarget = ref('')
const editingTemplate = ref(null)
const newItemText = ref('')
const newItemType = ref('checkbox')

// Журналы
const journalTemplates = ref([])
const showJournalTemplateForm = ref(false)
const editingJournalTemplateId = ref(null)
const journalTemplateForm = ref({ name: '', description: '', fields: [] })
const activeJournal = ref(null)
const journalValues = ref({})
const journalNotes = ref('')
const journalEntries = ref([])

const menuItemStyle = (tab) => ({ padding: '10px 20px', cursor: 'pointer', background: page.value === tab ? '#333' : 'transparent', color: page.value === tab ? '#ff6b35' : '#ccc', borderLeft: page.value === tab ? '3px solid #ff6b35' : '3px solid transparent' })
const typeLabel = (t) => ({ checkbox: '✅', photo: '📷', number: '🔢' }[t] || t)
const getRoleLabel = (rid) => (allRoles.value.find(r => r.id === rid) || {}).label || '—'
const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU') : '—'
const pageTitle = (p) => ({ bookings: 'Брони', dashboard: 'Дашборд смены', schedule: 'График смен', timesheet: 'Табель', settings: 'Настройки' }[p] || p)
const getUserName = (uid) => (users.value.find(u => u.id === uid) || {}).full_name || '—'

const loadAll = async () => {
  const [r1, r2, r3, r4, r5] = await Promise.all([
    supabase.from('roles').select('*'),
    supabase.from('permissions').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('templates').select('*'),
    supabase.from('journal_templates').select('*')
  ])
  if (r1.data) allRoles.value = r1.data
  if (r2.data) allPermissions.value = r2.data
  if (r3.data) users.value = r3.data
  if (r4.data) templates.value = r4.data
  if (r5.data) journalTemplates.value = r5.data
  if (currentUser.value) currentUserRole.value = allRoles.value.find(r => r.id === currentUser.value.role_id) || null
}

// Роли
const saveRole = async () => {
  if (!roleForm.value.code || !roleForm.value.label) return alert('Заполни')
  if (editingRoleId.value) await supabase.from('roles').update({ label: roleForm.value.label, permissions: roleForm.value.permissions }).eq('id', editingRoleId.value)
  else await supabase.from('roles').insert(roleForm.value)
  cancelRoleForm(); loadAll()
}
const editRole = (r) => { editingRoleId.value = r.id; roleForm.value = { code: r.code, label: r.label, permissions: [...r.permissions] }; showRoleForm.value = true }
const cancelRoleForm = () => { showRoleForm.value = false; editingRoleId.value = null; roleForm.value = { code: '', label: '', permissions: [] } }
const deleteRole = async (id) => { if (confirm('Удалить?')) { await supabase.from('roles').delete().eq('id', id); loadAll() } }

// Пользователи
const saveUser = async () => {
  if (!userForm.value.full_name || !userForm.value.login || !userForm.value.password || !userForm.value.role_id) return alert('Заполни все поля')
  if (editingUserId.value) {
    const upd = { full_name: userForm.value.full_name, email: userForm.value.email, role_id: userForm.value.role_id }
    if (userForm.value.password) upd.password_hash = userForm.value.password
    await supabase.from('profiles').update(upd).eq('id', editingUserId.value)
  } else {
    const { error } = await supabase.from('profiles').insert({ full_name: userForm.value.full_name, email: userForm.value.email, login: userForm.value.login, password_hash: userForm.value.password, role_id: userForm.value.role_id })
    if (error) { if (error.code === '23505') return alert('Логин занят'); return alert('Ошибка: ' + error.message) }
  }
  cancelUserForm(); loadAll()
}
const editUser = (u) => { editingUserId.value = u.id; userForm.value = { full_name: u.full_name, email: u.email || '', login: u.login || '', password: '', role_id: u.role_id }; showUserForm.value = true }
const cancelUserForm = () => { showUserForm.value = false; editingUserId.value = null; userForm.value = { full_name: '', email: '', login: '', password: '', role_id: '' } }
const deleteUser = async (id) => { if (confirm('Удалить?')) { await supabase.from('profiles').delete().eq('id', id); loadAll() } }
const updateUserRole = async (uid, rid) => { await supabase.from('profiles').update({ role_id: rid }).eq('id', uid); loadAll() }

// Журналы
const saveJournalTemplate = async () => {
  if (!journalTemplateForm.value.name) return alert('Введи название')
  const data = { name: journalTemplateForm.value.name, description: journalTemplateForm.value.description, fields: journalTemplateForm.value.fields.filter(f => f.label) }
  if (editingJournalTemplateId.value) await supabase.from('journal_templates').update(data).eq('id', editingJournalTemplateId.value)
  else await supabase.from('journal_templates').insert(data)
  cancelJournalTemplateForm(); loadAll()
}
const editJournalTemplate = (jt) => { editingJournalTemplateId.value = jt.id; journalTemplateForm.value = { name: jt.name, description: jt.description || '', fields: jt.fields ? [...jt.fields] : [] }; showJournalTemplateForm.value = true }
const cancelJournalTemplateForm = () => { showJournalTemplateForm.value = false; editingJournalTemplateId.value = null; journalTemplateForm.value = { name: '', description: '', fields: [] } }
const deleteJournalTemplate = async (id) => { if (confirm('Удалить?')) { await supabase.from('journal_templates').delete().eq('id', id); loadAll() } }

const openJournal = async (jt) => {
  activeJournal.value = jt
  journalValues.value = {}
  journalNotes.value = ''
  const { data } = await supabase.from('journal_entries').select('*').eq('template_id', jt.id).order('created_at', { ascending: false }).limit(10)
  if (data) journalEntries.value = data
}

const submitJournal = async () => {
  const values = {}
  for (const [i, field] of activeJournal.value.fields.entries()) {
    values[field.label] = journalValues.value[i] || ''
  }
  await supabase.from('journal_entries').insert({ template_id: activeJournal.value.id, user_id: currentUser.value.id, values, notes: journalNotes.value })
  alert('Запись сохранена!')
  openJournal(activeJournal.value)
}

// Шаблоны чек-листов (упрощено)
const createTemplate = async () => { if (!newName.value || !newRoleTarget.value) return alert('Заполни'); await supabase.from('templates').insert({ name: newName.value, role_target: newRoleTarget.value, items: [] }); showCreate.value = false; newName.value = ''; newRoleTarget.value = ''; loadAll() }
const openEditor = (t) => { editingTemplate.value = { ...t, items: [...t.items] }; page.value = '' }

loadAll()
</script>
