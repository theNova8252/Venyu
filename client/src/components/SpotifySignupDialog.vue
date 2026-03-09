<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="spotify-signup-dialog">
      <q-card-section class="dialog-header">
        <div>
          <div class="dialog-eyebrow">Before Spotify Login</div>
          <h3 class="dialog-title">Complete your profile first</h3>
          <p class="dialog-copy">
            Sign in only works if you already have a Spotify account.
          </p>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-5"
          :disable="loading"
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="dialog-body">
        <div class="notice-box">
          <q-icon name="info" size="18px" />
          <span>Your first name and birth date are required. You must be at least 16.</span>
        </div>

        <q-form ref="formRef" class="dialog-form" @submit.prevent="submitForm">
          <q-input
            v-model="form.firstName"
            outlined
            dense
            label="First name"
            autocomplete="given-name"
            :rules="firstNameRules"
          />

          <q-input
            v-model="form.lastName"
            outlined
            dense
            label="Last name (optional)"
            autocomplete="family-name"
          />

          <q-input
            v-model="form.birthDate"
            outlined
            dense
            type="date"
            label="Birth date"
            :rules="birthDateRules"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="dialog-actions">
        <q-btn flat no-caps label="Cancel" :disable="loading" @click="closeDialog" />
        <q-btn
          unelevated
          no-caps
          color="green-6"
          label="Continue with Spotify"
          :loading="loading"
          @click="submitForm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue';

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'update:modelValue']);

const formRef = ref(null);
const form = reactive({
  firstName: '',
  lastName: '',
  birthDate: '',
});

const firstNameRules = [
  (value) => !!String(value || '').trim() || 'First name is required',
];

const calculateAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

const birthDateRules = [
  (value) => String(value || '').trim().length > 0 || 'Birth date is required',
  (value) => {
    const age = calculateAgeFromBirthDate(value);
    return Number.isInteger(age) || 'Enter a valid birth date';
  },
  (value) => {
    const age = calculateAgeFromBirthDate(value);
    return age >= 16 || 'You must be 16+';
  },
];

const closeDialog = () => {
  emit('update:modelValue', false);
};

const submitForm = async () => {
  const isValid = await formRef.value?.validate?.();
  if (!isValid) return;

  emit('submit', {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthDate: form.birthDate,
  });
};
</script>

<style scoped lang="scss">
.spotify-signup-dialog {
  width: min(92vw, 460px);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(30, 215, 96, 0.16), transparent 38%),
    linear-gradient(180deg, #151718 0%, #101213 100%);
  color: #f4f7f5;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.dialog-eyebrow {
  margin-bottom: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1ed760;
}

.dialog-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
}

.dialog-copy {
  margin: 0.5rem 0 0;
  color: rgba(244, 247, 245, 0.72);
  line-height: 1.45;
}

.dialog-body {
  padding-top: 0.25rem;
}

.notice-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border-radius: 16px;
  background: rgba(30, 215, 96, 0.09);
  border: 1px solid rgba(30, 215, 96, 0.22);
  color: #d7fbe5;
  font-size: 0.92rem;
}

.dialog-form {
  display: grid;
  gap: 0.9rem;
}

.dialog-form :deep(.q-field__control) {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.dialog-form :deep(.q-field__native),
.dialog-form :deep(.q-field__label) {
  color: #f4f7f5;
}

.dialog-actions {
  padding: 0 1rem 1rem;
}
</style>
