<template>
  <div style="height: 100%; position: relative">
    <canvas ref="canvas" style="width: 100%; height: 100%" />
    <div style="position: absolute; top: 0; left: 0; padding: 15px;">
      Build with Vue.
    </div>
  </div>
</template>

<script>
  import init from "./rain";
  export default {
    name: "Rain",
    mounted() {
      const canvas = this.$refs.canvas;
      init(canvas);
    }
  }
</script>

<style scoped>

</style>