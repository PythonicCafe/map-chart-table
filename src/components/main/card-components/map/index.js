import { defineComponent } from 'vue'

import Map from '@/components/main/card-components/map/map'
import YearSlider from '@/components/main/card-components/map/year-slider'
import MapRange from '@/components/main/card-components/map/map-range'

export default defineComponent({
    components: {
        Map,
        MapRange,
        YearSlider,
    },
    setup() {},
    template: `
    <section>
      <div class="map-element-container">
        <MapRange />
        <div class="map-content">
          <Map />
          <YearSlider />
        </div>
      </div>
    </section>
  `,
})
