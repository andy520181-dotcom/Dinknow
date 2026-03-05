<template>
  <view class="agreement-page">
    <scroll-view class="agreement-scroll" scroll-y>
      <view class="agreement-body">

        <text class="section-title">一、总则</text>
        <text class="section-item">1. 欢迎您使用 Dinknow（以下简称"本平台"）。本用户协议（以下简称"本协议"）由您与 Dinknow 运营方签订，请您在注册或使用本平台前仔细阅读本协议。</text>
        <text class="section-item">2. 您注册、登录或使用本平台，即表示您同意接受本协议的全部条款。如您不同意本协议，请勿使用本平台。</text>

        <text class="section-title">二、账号注册与安全</text>
        <text class="section-item">1. 您需通过微信手机号实名注册账号，注册时应提供真实、准确的信息。</text>
        <text class="section-item">2. 您有责任保管好自己的账号，因您自身原因导致的账号信息泄露，本平台不承担责任。</text>
        <text class="section-item">3. 您不得将账号转让、出借或以任何方式允许他人使用。</text>

        <text class="section-title">三、用户行为规范</text>
        <text class="section-item">1. 您不得发布虚假、违法或侵权的活动信息。</text>
        <text class="section-item">2. 您不得利用本平台从事任何违法或违规活动。</text>
        <text class="section-item">3. 您发起的活动须对内容的真实性和合法性负责。</text>
        <text class="section-item">4. 本平台有权对违规行为进行处理，包括但不限于警告、封号等。</text>

        <text class="section-title">四、知识产权</text>
        <text class="section-item">1. 本平台的所有内容（包括但不限于文字、图片、界面设计）归 Dinknow 所有，受法律保护。</text>
        <text class="section-item">2. 未经许可，您不得复制、传播或商业使用本平台的内容。</text>

        <text class="section-title">五、免责声明</text>
        <text class="section-item">1. 本平台仅提供技术支持，线下活动由发起人自行组织，本平台不对活动安全及纠纷承担责任。</text>
        <text class="section-item">2. 因不可抗力、网络故障等导致的服务中断，本平台不承担赔偿责任。</text>

        <text class="section-title">六、协议变更</text>
        <text class="section-item">本平台有权随时修改本协议，修改后将在平台内公告。您继续使用平台即视为接受修改后的协议。</text>

        <text class="section-title">七、联系我们</text>
        <text class="section-item">如您对本协议有任何疑问，可通过平台内的客服反馈功能联系我们。</text>

      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
// NOTE: 纯展示页面，无需业务逻辑
</script>

<style lang="scss" scoped>
.agreement-page {
  height: 100vh;
  background: #ffffff;
  box-sizing: border-box;
}

.agreement-scroll {
  height: 100%;
}

.agreement-body {
  padding: 20px 16px 40px;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1e;
  line-height: 1.6;
  margin-top: 20px;
  margin-bottom: 8px;
}

.agreement-body .section-title:first-child {
  margin-top: 0;
}

.section-item {
  display: block;
  font-size: 12px;
  color: #3c3c43;
  line-height: 1.8;
  margin-bottom: 10px;
}
</style>
