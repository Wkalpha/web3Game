<template>
  <div class="badge-section">
    <h2>您的徽章</h2>
    <div v-if="userBadge.length > 0" class="badges">
      <div v-for="badge in userBadge" :key="badge.id" class="badge-item">
        <p>{{ badge.name }}</p>
        <p>{{ badge.effect }}</p>
      </div>
    </div>
    <p v-else>尚未獲得任何徽章</p>
  </div>
</template>

<script>
export default {
  props: {
    walletAddress: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      userBadge: [],
    };
  },
};
</script>

<style scoped>
.badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-item {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f4f4f4;
  text-align: center;
}
</style>