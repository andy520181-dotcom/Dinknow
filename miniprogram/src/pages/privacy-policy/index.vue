<template>
  <view class="agreement-page">
    <scroll-view class="agreement-scroll" scroll-y>
      <view class="agreement-body">

        <text class="section-title">一、信息收集范围</text>
        <text class="section-item">注册登录时，我们通过微信获取您的手机号码，用于账号认证与身份识别。</text>
        <text class="section-item">您主动填写的昵称、头像、性别、地区、DUPR 水平等个人资料。</text>
        <text class="section-item">您授权后获取的地理位置信息，用于计算活动距离与城市筛选。</text>
        <text class="section-item">您在平台上发起或参与的活动信息。</text>

        <text class="section-title">二、信息使用目的</text>
        <text class="section-item">1. 提供基础服务：注册、登录、发起活动、参与活动。</text>
        <text class="section-item">2. 改善用户体验：根据您的位置推荐附近活动。</text>
        <text class="section-item">3. 安全保障：防止账号被盗用或恶意行为。</text>
        <text class="section-item">4. 平台运营统计：匿名化的功能使用统计，不涉及个人身份。</text>

        <text class="section-title">三、信息共享</text>
        <text class="section-item">1. 我们不会向第三方出售您的个人信息。</text>
        <text class="section-item">2. 活动参与者的昵称、头像可能在活动详情页对其他参与者可见。</text>
        <text class="section-item">3. 法律要求：若依据法律规定需要披露，我们将依法执行。</text>

        <text class="section-title">四、信息存储与安全</text>
        <text class="section-item">1. 您的数据存储于微信云开发服务（CloudBase），受腾讯云安全保护。</text>
        <text class="section-item">2. 手机号等敏感信息采用加密方式存储，不以明文传输。</text>
        <text class="section-item">3. 我们定期评估安全风险并采取必要措施保护您的数据。</text>

        <text class="section-title">五、您的权利</text>
        <text class="section-item">1. 您可以随时在个人中心修改或删除您的昵称、头像等资料。</text>
        <text class="section-item">2. 您可以申请注销账号，注销后我们将删除您的个人信息。</text>
        <text class="section-item">3. 如需行使数据权利，请通过平台客服联系我们。</text>

        <text class="section-title">六、Cookie 与本地存储</text>
        <text class="section-item">本平台使用微信小程序本地缓存（Storage）存储您的登录状态和偏好设置，以提升访问速度。您可以通过删除小程序缓存方式清除本地数据。</text>

        <text class="section-title">七、未成年人保护</text>
        <text class="section-item">本平台不面向 14 周岁以下未成年人收集个人信息。如发现误收集，请联系我们删除。</text>

        <text class="section-title">八、本政策的更新</text>
        <text class="section-item">本隐私政策如有更新，将在平台内通知您。继续使用平台即视为同意更新后的政策。</text>

        <text class="section-title">九、联系我们</text>
        <text class="section-item">如对本隐私政策有任何疑问，请通过平台内的客服反馈功能联系我们处理。</text>

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
