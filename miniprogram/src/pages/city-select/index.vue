<template>
  <view class="city-select-page">
    <view class="header-bar">
      <view class="back-btn" @tap="handleBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="search-box">
        <image class="search-icon" src="/static/icons/search.png" mode="aspectFit" />
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索城市/地区"
          @input="handleSearch"
        />
      </view>
    </view>

    <view class="current-city-section" v-if="!searchKeyword">
      <view class="section-title">
        <text class="location-icon">📍</text>
        <text>当前城市</text>
      </view>
      <view class="current-city-tag" @tap="handleSelectCity(currentCity)">
        <text>{{ currentCity }}</text>
      </view>
    </view>

    <scroll-view 
      class="city-list" 
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="searchKeyword && filteredCities.length === 0" class="empty">
        <text>未找到相关城市</text>
      </view>
      <template v-else>
        <view
          v-for="(group, groupKey) in displayCities"
          :key="groupKey"
          :id="`group-${groupKey}`"
          :class="['city-group', `group-${groupKey}`]"
        >
          <view class="group-title">{{ groupKey }}</view>
          <view
            v-for="city in group"
            :key="city"
            class="city-item"
            @tap="handleSelectCity(city)"
          >
            <text>{{ city }}</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <view class="alphabet-index" v-if="!searchKeyword">
      <view
        v-for="letter in alphabet"
        :key="letter"
        :class="['index-letter', { 'active': activeLetter === letter }]"
        @tap="scrollToLetter(letter)"
      >
        <text>{{ letter }}</text>
      </view>
    </view>

    <!-- 点击字母时的放大提示 -->
    <view v-if="activeLetter" class="letter-popup" :class="{ 'show': showLetterPopup }">
      <text class="popup-letter">{{ activeLetter }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const currentCity = ref('萍乡市')
const searchKeyword = ref('')
const selectedCity = ref('')
const scrollIntoView = ref('')
const activeLetter = ref('')
const showLetterPopup = ref(false)
const fromProfile = ref(false)

// 中国主要城市列表（按拼音首字母分组）
const citiesByLetter: Record<string, string[]> = {
  'A': ['安庆市', '安阳市', '鞍山市'],
  'B': ['北京市', '包头市', '保定市', '蚌埠市', '宝鸡市', '本溪市', '滨州市'],
  'C': ['重庆市', '长沙市', '成都市', '常州市', '长春市', '常德市', '沧州市', '承德市', '滁州市', '池州市', '赤峰市', '朝阳市', '潮州市', '郴州市', '崇左市'],
  'D': ['大连市', '东莞市', '大庆市', '大同市', '丹东市', '德阳市', '东营市', '德州市', '定西市', '达州市'],
  'E': ['鄂尔多斯市', '恩施市', '鄂州市'],
  'F': ['福州市', '佛山市', '抚顺市', '阜阳市', '抚州市', '防城港市'],
  'G': ['广州市', '贵阳市', '桂林市', '赣州市', '广安市', '广元市', '贵港市'],
  'H': ['杭州市', '合肥市', '哈尔滨市', '海口市', '呼和浩特市', '邯郸市', '衡阳市', '湖州市', '惠州市', '黄山市', '黄石市', '怀化市', '淮安市', '淮南市', '菏泽市', '衡水市', '河源市', '鹤壁市', '黑河市', '红河市', '呼伦贝尔市', '葫芦岛市', '怀化市'],
  'J': ['济南市', '南京市', '锦州市', '九江市', '吉安市', '江门市', '揭阳市', '焦作市', '荆州市', '金华市', '嘉兴市', '晋中市', '晋城市', '景德镇市', '济宁市', '鸡西市', '佳木斯市', '金昌市', '酒泉市'],
  'K': ['昆明市', '开封市', '克拉玛依市', '库尔勒市', '喀什市'],
  'L': ['兰州市', '洛阳市', '柳州市', '廊坊市', '丽江市', '乐山市', '聊城市', '连云港市', '临汾市', '六安市', '龙岩市', '娄底市', '泸州市', '漯河市', '莱芜市', '莱阳市', '辽阳市', '辽源市', '临沧市', '临夏市', '六盘水市'],
  'M': ['绵阳市', '马鞍山市', '茂名市', '眉山市', '梅州市', '牡丹江市'],
  'N': ['宁波市', '南京市', '南宁市', '南充市', '南阳市', '南通市', '内江市', '宁德市', '南平市', '怒江市'],
  'P': ['萍乡市', '平顶山市', '盘锦市', '攀枝花市', '莆田市', '普洱市'],
  'Q': ['青岛市', '泉州市', '秦皇岛市', '齐齐哈尔市', '曲靖市', '衢州市', '清远市', '钦州市', '庆阳市'],
  'R': ['日照市', '日喀则市'],
  'S': ['上海市', '深圳市', '苏州市', '沈阳市', '石家庄市', '三亚市', '汕头市', '韶关市', '上饶市', '商丘市', '十堰市', '随州市', '邵阳市', '宿迁市', '宿州市', '三明市', '四平市', '松原市', '绥化市', '遂宁市', '汕尾市'],
  'T': ['天津市', '太原市', '台州市', '泰安市', '泰州市', '唐山市', '通化市', '通辽市', '铜陵市', '铜仁市', '天水市'],
  'W': ['武汉市', '温州市', '无锡市', '乌鲁木齐市', '芜湖市', '潍坊市', '威海市', '渭南市', '梧州市', '武威市', '文山市', '万宁市'],
  'X': ['西安市', '厦门市', '西宁市', '徐州市', '襄阳市', '新乡市', '信阳市', '湘潭市', '咸阳市', '邢台市', '宣城市', '新余市', '忻州市', '孝感市', '许昌市', '湘西市', '锡林郭勒市', '兴安盟市'],
  'Y': ['银川市', '扬州市', '烟台市', '盐城市', '宜昌市', '宜春市', '益阳市', '岳阳市', '运城市', '营口市', '阳江市', '云浮市', '玉林市', '玉溪市', '延边市', '伊春市', '伊犁市', '雅安市', '宜宾市', '永州市', '鹰潭市'],
  'Z': ['郑州市', '珠海市', '镇江市', '株洲市', '淄博市', '枣庄市', '张家口市', '张家界市', '肇庆市', '湛江市', '中山市', '舟山市', '自贡市', '资阳市', '驻马店市', '周口市', '昭通市', '中卫市', '张掖市', '遵义市']
}

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

// 所有城市列表（扁平化）
const allCities = computed(() => {
  return Object.values(citiesByLetter).flat()
})

// 搜索过滤后的城市
const filteredCities = computed(() => {
  if (!searchKeyword.value.trim()) {
    return []
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return allCities.value.filter(city => 
    city.toLowerCase().includes(keyword) ||
    city.includes(keyword)
  )
})

// 显示的城市列表（分组或搜索结果）
const displayCities = computed(() => {
  if (searchKeyword.value.trim()) {
    // 搜索结果按字母分组
    const grouped: Record<string, string[]> = {}
    filteredCities.value.forEach(city => {
      const firstLetter = city.charAt(0).toUpperCase()
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = []
      }
      grouped[firstLetter].push(city)
    })
    return grouped
  } else {
    // 显示所有城市（按字母分组）
    return citiesByLetter
  }
})

function handleSearch() {
  // 搜索逻辑已在 computed 中处理
}

function handleSelectCity(city: string) {
  selectedCity.value = city
  if (fromProfile.value) {
    // 个人页地区：写入 profile_region，个人页 onShow 会保存到资料
    uni.setStorageSync('profile_region', city)
  } else {
    // 广场页定位：写入 selected_city
    uni.setStorageSync('selected_city', city)
  }
  setTimeout(() => {
    uni.navigateBack()
  }, 100)
}

function handleBack() {
  uni.navigateBack()
}

function scrollToLetter(letter: string) {
  // 检查该字母是否有对应的城市组
  if (!displayCities.value[letter] || displayCities.value[letter].length === 0) {
    return
  }
  
  // 设置当前激活的字母，显示点击反馈
  activeLetter.value = letter
  showLetterPopup.value = true
  
  // 使用 scroll-into-view 滚动到对应字母的城市组
  scrollIntoView.value = `group-${letter}`
  
  // 清除 scroll-into-view，以便下次可以再次滚动到同一位置
  setTimeout(() => {
    scrollIntoView.value = ''
  }, 300)
  
  // 清除点击反馈效果
  setTimeout(() => {
    showLetterPopup.value = false
    setTimeout(() => {
      activeLetter.value = ''
    }, 200)
  }, 500)
}

onLoad((options: any) => {
  fromProfile.value = options.from === 'profile'
  if (options.currentCity) {
    try {
      const decoded = decodeURIComponent(options.currentCity)
      if (decoded) currentCity.value = decoded
    } catch (_) {}
  }
})
</script>

<style lang="scss" scoped>


.city-select-page {
  min-height: 100vh;
  background: $ios-bg-primary;
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
}

.header-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: $ios-bg-primary;
  border-bottom: 1px solid $ios-separator;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    opacity: 0.6;
  }
}

.back-icon {
  font-size: 28px;
  color: $ios-text-primary;
  font-weight: 300;
  line-height: 1;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  padding: 4px 16px;
  gap: 8px;
  min-height: 28px;
}

.search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 15px;
  color: $ios-text-primary;
  background: transparent;
  border: none;
  
  &::placeholder {
    color: $ios-text-tertiary;
  }
}

.current-city-section {
  padding: 16px;
  border-bottom: 1px solid $ios-separator;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $ios-text-secondary;
  margin-bottom: 12px;
}

.location-icon {
  font-size: 14px;
}

.current-city-tag {
  display: inline-block;
  padding: 8px 16px;
  background: $ios-blue;
  color: #fff;
  border-radius: 20px;
  font-size: 15px;
  font-weight: $ios-font-weight-medium;
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.city-list {
  flex: 1;
  height: calc(100vh - 200px - env(safe-area-inset-top));
}

.city-group {
  padding: 0 16px;
}

.group-title {
  padding: 12px 0 8px 0;
  font-size: 16px;
  font-weight: $ios-font-weight-bold;
  color: $ios-text-primary;
  background: $ios-bg-primary;
  position: sticky;
  top: 0;
  z-index: 10;
}

.city-item {
  padding: 14px 0;
  border-bottom: 1px solid rgba($ios-separator, 0.5);
  font-size: 15px;
  color: $ios-text-primary;
  
  &:active {
    background: rgba($ios-blue, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.empty {
  padding: 60px 20px;
  text-align: center;
  color: $ios-text-tertiary;
  font-size: 15px;
}

.alphabet-index {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
}

.index-letter {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: $ios-blue;
  font-weight: $ios-font-weight-medium;
  transition: all 0.2s ease;
  
  &:active {
    background: rgba($ios-blue, 0.15);
    border-radius: 4px;
    transform: scale(1.2);
  }
  
  &.active {
    background: rgba($ios-blue, 0.2);
    border-radius: 4px;
    transform: scale(1.15);
    color: $ios-blue;
  }
}

.letter-popup {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: all 0.2s ease;
  pointer-events: none;
  
  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.popup-letter {
  font-size: 48px;
  font-weight: $ios-font-weight-bold;
  color: #fff;
  text-align: center;
}
</style>
