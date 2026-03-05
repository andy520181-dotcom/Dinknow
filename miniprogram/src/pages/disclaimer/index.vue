<template>
  <view class="disclaimer-page">
    <scroll-view class="disclaimer-scroll" scroll-y>
      <view class="disclaimer-body">

        <!-- 一、报名须知 -->
        <text class="section-title">一、报名须知</text>
        <text class="section-item">1、本平台上的活动/比赛(具有潜在的危险性和不可预知性)，参加者须对自身的安全和行为负责。</text>
        <text class="section-item">2、报名参加本平台上活动(比赛)者应当对自身的身体条件进行全面了解，并科学评估是否适宜参加本次活动，谢绝有心血管疾病隐患、骨质疏松等不宜剧烈运动者参加，感冒/发烧/哮喘/高血压/心脏病/受伤/饮酒等原因，均不应参加或继续进行运动，参加者须确保身体状况符合运动条件，活动期间发生的任何伤害事故及意外责任自负，与本平台无关。</text>
        <text class="section-item">3、替他人报名(包括但不限于挂人和代报名、转让活动名额等情况)，报名者需向被报名的人完整说明活动性质及免责情况。被代报名后实际参与活动的人，视为已了解活动性质及免责说明声明。</text>
        <text class="section-item">4、Dinknow平台仅为活动提供平台技术支持，活动后续事项由主理人负责组织，费用均为主理人收取。如您因活动发起、组织、撤销、下线、退款等引起的纠纷须由主理人自行解决并承担后果。不对您在运动中所产生的任何意外伤害承担责任，包括因您自身或第三人原因导致的伤害等情形。</text>
        <text class="section-item">5、报名并参与活动，请您谨慎甄别主理人发起活动的身份及信息，注意主理人提示的内容，参加活动前妥善评估活动安全性及自身身体状况适合参加活动安排，确保参与线下活动时的人身安全与财产安全，若因隐瞒身体疾病或伤情故意参加活动导致的意外伤害需自行承担责任。</text>
        <text class="section-item">6、报名参加本平台上活动(比赛)者视为年满18周岁的完全民事行为能力人，未满18周岁的限制民事行为能力人和无民事行为能力人应当在其监护人的陪同下参加。</text>
        <text class="section-item">7、用户明确同意平台服务的使用由用户个人承担风险，本平台不作任何类型的担保，不担保服务一定能满足用户的要求，也不担保服务一定不会受中断，对服务的安全性，出错发生都不作担保。</text>
        <text class="section-item">8、请穿戴合适的运动装备，运动前充分热身，运动过程中注意保护队友和对手，文明礼让不霸场。</text>
        <text class="section-item">9、活动过程中，组织方可能会拍摄带有您肖像的现场照片及视频，并用做后期宣传，请您确认同意将自身肖像用于本次活动相关宣传，若不同意，可联系后台工作人员或活动组织方予以说明。</text>
        <text class="section-item">10、报名者报名活动成功后视为已知晓平台免责声明且自愿参加(具有潜在的危险性和不可预知性)活动。</text>

        <!-- 二、支付须知 -->
        <text class="section-title">二、支付须知</text>
        <text class="section-item">1、信乐部/球馆(活动发布方)等组织发布的活动，当您报名、付费参与活动时，活动发布方与您形成直接的法律关系(如买卖合同关系等等)，由此产生的所有责任均由您双方承担，Dinknow仅作为技术提供方不承担任何连带责任。</text>
        <text class="section-item">2、Dinknow作为第三方平台，代收的报名费通过微信平台转交给活动发布方，如您需要开具发票，请与活动发布方联系。</text>

        <!-- 三、特别提醒 -->
        <text class="section-title">三、特别提醒</text>
        <text class="section-item">因活动组织者发布的活动会同步至第三方平台(如高德户外)，为了便于Dinknow与第三方平台信息同步，第三方平台向其他用户展示已报名用户信息，您同意Dinknow将您的头像、昵称提供给第三方平台用于信息展示。</text>

      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
// NOTE: 纯展示页面，无需业务逻辑
</script>

<style lang="scss" scoped>
// NOTE: page 和 scroll-view 必须明确撑满全屏才能正常滚动
.disclaimer-page {
  height: 100vh;
  background: #ffffff;
  box-sizing: border-box;
}

.disclaimer-scroll {
  height: 100%;
}

.disclaimer-body {
  padding: 20px 16px 40px;
}

// 大写标题（一、二、三）
.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1e;
  line-height: 1.6;
  margin-top: 20px;
  margin-bottom: 8px;
}

// 第一个标题顶部不加额外间距
.disclaimer-body .section-title:first-child {
  margin-top: 0;
}

// 每条编号条目
.section-item {
  display: block;
  font-size: 12px;
  color: #3c3c43;
  line-height: 1.8;
  margin-bottom: 10px;
}
</style>
