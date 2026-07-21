const SITE_DATA = {
  title: "摸鱼神国",
  subtitle: "攻略 · 工具 · 资源集",
  blocks: [
    {
      type: "profile",
      name: "摸鱼神国",
      avatar: "avatar.jpg",
      username: "ZO.oEY",
      bio: "在此献上摸鱼圣器，愿你在工位也能喘口气。"
    },
    {
      type: "nav-links",
      name: "教程与资源",
      icon: "📎",
      page: "jiaocheng",
      subcategories: [
        {
          name: "酒馆区",
          links: [
            { title: "哪种搭建方式适合你？", url: "guides/jiuguan-guide.html", desc: "手机、电脑、云服务器，快速搞懂该选哪种" },
            { title: "酒馆搭建教程-PC电脑", url: "guides/pc-setup.html", desc: "图文教程，从零在电脑上安装酒馆" },
            { title: "酒馆搭建教程-安卓手机", url: "guides/android-setup.html", desc: "Termux + 一键脚本，手机随身开玩" },
            { title: "酒馆搭建教程-VPS云服务器", url: "guides/vps-setup.html", desc: "腾讯云 + 1Panel 面板，从零搭建云端酒馆" },
            { title: "酒馆使用指南", url: "guides/jiuguan-usage.html", desc: "常用插件、推荐配置与使用技巧" }
          ]
        }
      ]
    },
    {
      type: "nav-links",
      name: "妙妙小工具",
      icon: "🛠️",
      page: "tools",
      subcategories: [
        {
          name: "京东自营店铺小工具",
          links: [
            { title: "商品主图更换", url: "tools/JD/main-image.html", desc: "批量更换主图·图片重命名" },
            { title: "数据分析小工具", url: "tools/JD/data-analysis.html", desc: "销售额·流量·转化数据分析" }
          ]
        },
        {
          name: "通用摸鱼小工具",
          links: [
            { title: "鼠标识别检测", url: "tools/dev/mouse-debug.html", desc: "光标热点校准 · 偏移量可视化" },
            { title: "截图照片裁边", url: "tools/dev/photo-crop.html", desc: "自动裁掉截图上下黑白边" },
            { title: "PDF 发票双拼", url: "tools/dev/pdf-invoice-two-up.html", desc: "两张发票合并到一页 A4，方便打印" }
          ]
        }
      ]
    },
    {
      type: "nav-links",
      name: "好用站点",
      icon: "🌪",
      page: "haoyong",
      subcategories: [
        {
          name: "通用",
          links: [
            { title: "在线工具箱", url: "http://tool.myop.cn/", desc: "实用在线工具集合", target: "_blank" },
            { title: "PDF24 Tools", url: "https://tools.pdf24.org/zh/", desc: "PDF 合并、压缩、转换工具", target: "_blank" },
            { title: "ILovePDF", url: "https://www.ilovepdf.com/zh-cn", desc: "常用 PDF 在线处理", target: "_blank" },
            { title: "CloudConvert", url: "https://cloudconvert.com/", desc: "文件格式在线转换", target: "_blank" },
            { title: "剧OK", url: "https://juok3.top/", desc: "在线追剧 高清下载", target: "_blank" },
            { title: "硬核指南", url: "https://yinghezhinan.com/", desc: "影视资源大全", target: "_blank" },
            { title: "EmojiAll", url: "https://www.emojiall.com/zh-hans", desc: "emoji 大全", target: "_blank" },
            { title: "regex101", url: "https://regex101.com/", desc: "正则表达式测试与调试", target: "_blank" }
          ]
        },
        {
          name: "效率与写作",
          links: [
            { title: "DeepL", url: "https://www.deepl.com/translator", desc: "翻译与润色", target: "_blank" },
            { title: "秘塔写作猫", url: "https://xiezuocat.com/", desc: "中文文本校对", target: "_blank" },
            { title: "Excalidraw", url: "https://excalidraw.com/", desc: "手绘风白板画图", target: "_blank" },
            { title: "ProcessOn", url: "https://www.processon.com/", desc: "流程图、脑图、协作图表", target: "_blank" },
            { title: "JSON Editor Online", url: "https://jsoneditoronline.org/", desc: "JSON 查看与格式化", target: "_blank" }
          ]
        },
        {
          name: "外设工具箱",
          links: [
            { title: "显卡天梯图", url: "https://www.mydrivers.com/zhuanti/tianti/gpu/index.html", desc: "显卡性能排行", target: "_blank" },
            { title: "CPU天梯图", url: "https://www.mydrivers.com/zhuanti/tianti/cpu/index.html", desc: "CPU性能排行", target: "_blank" },
            { title: "Gamepad Tester", url: "https://gamepad-tester.com/", desc: "手柄按键检测", target: "_blank" },
            { title: "键盘测试", url: "http://keyboard.cn/", desc: "在线键盘按键检测", target: "_blank" },
            { title: "VIA", url: "https://usevia.app/", desc: "在线改键位工具", target: "_blank" }
          ]
        },
        {
          name: "临时邮箱",
          links: [
            { title: "TempMail.cn", url: "https://tempmail.cn/", desc: "中文临时邮箱", target: "_blank" },
            { title: "10-Minute Mail", url: "https://10-minutemail.com/", desc: "10分钟临时邮箱", target: "_blank" },
            { title: "215.im", url: "https://vip.215.im/", desc: "临时邮箱服务", target: "_blank" }
          ]
        },
        {
          name: "临时网盘",
          links: [
            { title: "文叔叔", url: "https://www.wenshushu.cn/", desc: "在线传文件", target: "_blank" },
            { title: "AirPortal", url: "https://www.airportal.cn/", desc: "空投文件传输", target: "_blank" },
            { title: "TLink", url: "https://www.ttttt.link/", desc: "临时文件分享", target: "_blank" },
            { title: "Send Anywhere", url: "https://send-anywhere.com/", desc: "跨平台文件传输", target: "_blank" },
            { title: "Wormhole", url: "https://wormhole.app/", desc: "端到端加密文件分享", target: "_blank" }
          ]
        },
        {
          name: "在线图片处理",
          links: [
            { title: "改图宝", url: "https://www.gaitubao.com/", desc: "在线图片编辑", target: "_blank" },
            { title: "做好图", url: "http://www.zuohaotu.com/image-converter.aspx", desc: "图片格式转换", target: "_blank" },
            { title: "凡科快图", url: "https://kt.fkw.com/tools.html", desc: "在线图片处理工具", target: "_blank" },
            { title: "Photopea", url: "https://www.photopea.com/", desc: "浏览器里的类 PS 编辑器", target: "_blank" },
            { title: "Squoosh", url: "https://squoosh.app/", desc: "图片压缩与格式转换", target: "_blank" },
            { title: "Remove.bg", url: "https://www.remove.bg/zh", desc: "AI 背景去除", target: "_blank" },
            { title: "TinyPNG", url: "https://tinypng.com/", desc: "智能图片压缩", target: "_blank" }
          ]
        },
        {
          name: "趣味网站",
          links: [
            { title: "合乎周礼", url: "https://hehuzhouli.com/", desc: "网络热梗与趣味文本", target: "_blank" },
            { title: "祖安分区", url: "https://caonima.de/", desc: "抽象嘴臭语料库", target: "_blank" }
          ]
        }
      ]
    }
  ]
};
