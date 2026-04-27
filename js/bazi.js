/*!
 * [四柱八字排盘工具] 
 * 
 * @description 生辰八字计算与分析
 * @copyright   Copyright (c) 2026 [hkargc at gmail dot com]
 * @license     Licensed under the MIT License.
 * @see         {@link https://github.com/hkargc/bazi} 项目仓库
 */
"use strict";
/**
 * 公共数据
 * @type type
 */
window.O = {
	keys: ['dyk', 'lyk', 'lmk', 'lrk', 'lsk'],
	types: ['dayun', 'liunian', 'liuyue', 'liuri', 'liushi']
};
/**
 * 全局设置
 * @type type
 */
window.G = { //GLOBAL
	k: 1, //自增长
	t: 0, //消息定时器
	user: "", //用户名
	pw_hash: "", //加密后的密码
	list: [], //保存的用户列表
	state: {
		page: 1, //当前第几页
		size: 144, //每页显示数量
		links: 1, //总计多少页
		start: 0, //起始位置
		keyword: ""
	},
	syear: 1, //一眼千年 start year
	eyear: date("Y") * 1 + 5, //end year
	timer: [], //定时器防止重复
	lines: [], //刑冲合害连线
	posts: [],
	query: [], //链接地址
	zcity: [] //真太阳时所在地
};
/**
 * Dexie存储器
 * @type Dexie
 */
window.db = null;
/**
 * key-value-storage
 */
window.kvs = {
	zwzs: 1,
	swap: 1,
	wxws: 1,
	jbzl: 1,
	xchh: 1,
	xscg: 1,
	xsss: 0
};
/**
 * 只取非负整数
 * @param {type} n
 */
function uint(n) {
	return max(0, intval(n));
}
/**
 * 来源: https://regexr.com/2rhq7
 * @param {type} Email
 * @returns {Boolean}
 */
function validateEmail(Email) {
	let pattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
	return pattern.test(Email);
}
/**
 * 点击"命"盘:清空连线;清空后续命盘;清空后续运盘
 * @param {type} k
 * @param {type} type 值为4至8
 * @returns {undefined}
 */
function mp(k, type) {
	k = uint(k);
	if (empty(k)) {
		return false;
	}
	type = uint(type);
	if (type < 4 || type > 8) {
		return false;
	}
	if ($(`#bz_block_${k}`).length !== 1) {
		return false;
	}
	for (let j = type; j <= 8; j++) {
		let ids = []; //要删除的划线
		let elm = document.getElementById("mp" + k + "-" + j);
		for (let i in G.lines[k]) {
			if (G.lines[k][i].start === elm) {
				ids.push(i);
				continue;
			}
			if (G.lines[k][i].end === elm) {
				ids.push(i);
				continue;
			}
		}
		ids.forEach(function(i) {
			G.lines[k][i].remove();
			delete G.lines[k][i];
		});
		$(elm).empty();
		$("#" + O.types[j - 4] + k + " >dl").each(function() {
			$(this).removeClass("selected");
			if (j !== type) {
				$(this).replaceWith("<dl></dl>");
			}
		});
	}
}
/**
 * 点击"运"盘
 * @param {type} k
 * @param {type} type
 * @param {type} dyk 默认选中的下标,从0开始 -1为不处理
 * @param {type} lyk
 * @param {type} lmk
 * @param {type} lrk
 * @param {type} lsk
 * @returns {undefined}
 */
function yp(k, type, dyk, lyk, lmk, lrk, lsk) {
	k = uint(k);
	if (empty(k)) {
		return false;
	}
	type = uint(type);
	if (type < 4 || type > 8) {
		return false;
	}
	if ($(`#bz_block_${k}`).length !== 1) {
		return false;
	}
	let o = G.posts[k];
	if (empty(o)) { //必然是先有数据
		return false;
	}
	let op = {
		dyk: intval(dyk),
		lyk: intval(lyk),
		lmk: intval(lmk),
		lrk: intval(lrk),
		lsk: intval(lsk)
	};
	mp(k, type); //清理命盘
	let jw = JW[o.ct];
	P.zwz = kvs["zwzs"]; //全局设置:早晚子时
	let p = P.fatemaps(o.xb, o.yy, o.mm, o.dd, o.hh, o.mt, o.ss, jw ? jw[2] : null, jw ? jw[3] : null, op);
	if (type === 4) { //点击大运,返回流年
		for (let i = 0; i < p.ly.length; i++) {
			let a = p.ly[i];
			let s = '<dl onclick="yp(' + k + ', 5, ' + op.dyk + ', ' + i + ', -1, -1, -1)">';
			s += '<dt>' + a["year"] + '年</dt>';
			s += '<dt>' + a["age"] + '岁</dt>';
			s += '<dd class="wx' + a["wxtg"] + '">';
			s += a["ctg"];
			s += '<span data-turn="1" style="display:none;">' + a["csstg"] + '</span>';
			s += '<span style="display:none;"></span>';
			s += '</dd>';
			s += '<dd class="wx' + a["wxdz"] + '">';
			s += a["cdz"];
			s += '<span data-turn="1" style="display:none;">';
			for (let j = 0; j < a["sscg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["sscg"][j] + '</b>';
			}
			s += '</span>';
			s += '<span data-turn="2" style="display:inline;">';
			for (let j = 0; j < a["bzcg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["bzcg"][j] + '</b>';
			}
			s += '</span>';
			s += '</dd>';
			s += '</dl>';
			$("#liunian" + k + " >dl:eq(" + i + ")").replaceWith(s);
		}
		let s = $("#dayun" + k + " >dl:eq(" + op.dyk + ")").html();
		$("#mp" + k + "-4").html(s);
	}
	if (type === 5) { //点击流年,返回流月
		for (let i = 0; i < p.lm.length; i++) {
			let a = p.lm[i];
			let s = '<dl onclick="yp(' + k + ', 6,  ' + op.dyk + ', ' + op.lyk + ', ' + i + ', -1, -1)">';
			s += '<dt style="position:relative;bottom:0">' + a["mm"] + '月' + a["dd"] + '日</dt>';
			s += '<dt>' + a["jq"] + '</dt>';
			s += '<dd class="wx' + a["wxtg"] + '">';
			s += a["ctg"];
			s += '<span data-turn="1" style="display:none;">' + a["csstg"] + '</span>';
			s += '<span style="display:none;"></span>';
			s += '</dd>';
			s += '<dd class="wx' + a["wxdz"] + '">';
			s += a["cdz"];
			s += '<span data-turn="1" style="display:none;">';
			for (let j = 0; j < a["sscg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["sscg"][j] + '</b>';
			}
			s += '</span>';
			s += '<span data-turn="2" style="display:inline;">';
			for (let j = 0; j < a["bzcg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["bzcg"][j] + '</b>';
			}
			s += '</span>';
			s += '</dd>';
			s += '</dl>';
			$("#liuyue" + k + " >dl:eq(" + i + ")").replaceWith(s);
		}
		let s = $("#liunian" + k + " >dl:eq(" + op.lyk + ")").html();
		$("#mp" + k + "-5").html(s);
	}
	if (type === 6) { //点击流月,返回流日
		for (let i = 0; i < p.lr.length; i++) {
			let a = p.lr[i];
			let s = '<dl onclick="yp(' + k + ', 7,  ' + op.dyk + ', ' + op.lyk + ', ' + op.lmk + ', ' + i + ', -1)">';
			s += '<dt style="position:relative;bottom:0">' + a["mm"] + '月</dt>';
			s += '<dt>' + a['dd'] + '日</dt>';
			s += '<dd class="wx' + a["wxtg"] + '">';
			s += a["ctg"];
			s += '<span data-turn="1" style="display:none;">' + a["csstg"] + '</span>';
			s += '<span style="display:none;"></span>';
			s += '</dd>';
			s += '<dd class="wx' + a["wxdz"] + '">';
			s += a["cdz"];
			s += '<span data-turn="1" style="display:none;">';
			for (let j = 0; j < a["sscg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["sscg"][j] + '</b>';
			}
			s += '</span>';
			s += '<span data-turn="2" style="display:inline;">';
			for (let j = 0; j < a["bzcg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["bzcg"][j] + '</b>';
			}
			s += '</span>';
			s += '</dd>';
			s += '</dl>';
			if ($("#liuri" + k + " >dl:eq(" + i + ")").length) { //日数不定
				$("#liuri" + k + " >dl:eq(" + i + ")").replaceWith(s);
			} else {
				$("#liuri" + k + " >dl:eq(" + (i - 1) + ")").after(s);
			}
		}
		let s = $("#liuyue" + k + " >dl:eq(" + op.lmk + ")").html();
		$("#mp" + k + "-6").html(s);
		let i = $("#liuri" + k + " >dl").length - 1;
		for (; i >= p.lr.length; i--) { //从后面往前删除无效的
			$("#liuri" + k + " >dl:eq(" + i + ")").remove();
		}
	}
	if (type === 7) { //点击流日,返回流时
		for (let i = 0; i < p.ls.length; i++) {
			let a = p.ls[i];
			let s = '<dl onclick="yp(' + k + ', 8,  ' + op.dyk + ', ' + op.lyk + ', ' + op.lmk + ', ' + op.lrk + ', ' + i + ')">';
			s += '<dt style="position:relative;bottom:0">' + a["shh"] + '-' + a['ehh'] + '</dt>';
			s += '<dt>时</dt>';
			s += '<dd class="wx' + a["wxtg"] + '">';
			s += a["ctg"];
			s += '<span data-turn="1" style="display:none;">' + a["csstg"] + '</span>';
			s += '<span style="display:none;"></span>';
			s += '</dd>';
			s += '<dd class="wx' + a["wxdz"] + '">';
			s += a["cdz"];
			s += '<span data-turn="1" style="display:none;">';
			for (let j = 0; j < a["sscg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["sscg"][j] + '</b>';
			}
			s += '</span>';
			s += '<span data-turn="2" style="display:inline;">';
			for (let j = 0; j < a["bzcg"].length; j++) {
				s += '<b class="wx' + a["wxcg"][j] + '">' + a["bzcg"][j] + '</b>';
			}
			s += '</span>';
			s += '</dd>';
			s += '</dl>';
			$("#liushi" + k + " >dl:eq(" + i + ")").replaceWith(s);
		}
		let s = $("#liuri" + k + " >dl:eq(" + op.lrk + ")").html();
		$("#mp" + k + "-7").html(s);
	}
	if (type === 8) { //流时
		let s = $("#liushi" + k + " >dl:eq(" + op.lsk + ")").html();
		$("#mp" + k + "-8").html(s);
	}
	for (let c = 4; c <= type; c++) { //逐档选中
		$("#" + O.types[c - 4] + k + " >dl:eq(" + op[O.keys[c - 4]] + ")").addClass("selected"); //选中
	}
	gx(k, p);
}
/**
 * 制作刑冲合害关系连线[比较复杂,当时一鼓作气完成的,现在已经看不明白了]
 * @param {type} k
 * @param {type} p fatemaps返回值
 * @returns {undefined}
 */
function gx(k, p) {
	k = uint(k);
	if (empty(k)) {
		return false;
	}
	if ($(`#bz_block_${k}`).length !== 1) {
		return false;
	}
	gx_remove(k); //移除所有重新计算
	G.lines[k] = [];
	let e = [0, 0]; //应该是用于计算线的高度
	let o = G.posts[k];
	if (empty(o)) { //必然是先有数据
		return false;
	}
	for (let i in p['gx']) {
		let a = P.GX[i];
		let b = p['gx'][i];
		e[a[0]]++;
		for (let j = 0;; j++) {
			let line = new LeaderLine(document.getElementById("mp" + k + "-" + b[j + 0]), document.getElementById("mp" + k + "-" + b[j + 1]), {
				size: 1,
				path: 'grid',
				startPlug: 'behind',
				endPlug: 'behind',
				hide: empty(kvs["xchh"]) || o.wz //设置或者未知
			});
			line.startSocket = (a[0] === 0) ? "top" : "bottom";
			line.endSocket = (a[0] === 0) ? "top" : "bottom";
			line.color = in_array(a[1], [0, 2]) ? 'red' : 'green';
			line.middleLabel = LeaderLine.captionLabel(j ? '' : a[4], {
				fontSize: '12px',
				color: line.color
			});
			line.startSocketGravity = e[a[0]] * 15;
			line.endSocketGravity = e[a[0]] * 15;
			line.fontSize = 12;
			G.lines[k].push(line);
			if (empty(b[j + 2])) {
				break;
			}
		}
	}
	$("#swap,#wxws,#xscg,#xsss").trigger("change", {
		k: k
	});
}
/**
 * 重新定位关系图
 * @param {type} k
 * @returns {undefined}
 */
function gx_resize(k) {
	k = uint(k);
	for (let K in G.lines) {
		K = uint(K);
		if (k && (K !== k)) {
			continue;
		}
		for (let i in G.lines[K]) {
			i = uint(i);
			if ((G.posts[k] && G.posts[k]["wz"]) || empty(kvs["xchh"])) { //如果时辰未知或无需划线
				G.lines[K][i].hide();
			} else {
				G.lines[K][i].position().show();
			}
		}
	}
}
/**
 * 清空关系
 * @param {type} k
 * @returns {undefined}
 */
function gx_remove(k) {
	for (let i in G.lines[k]) {
		G.lines[k][i].remove();
	}
	delete G.lines[k];
}
/**
 * 隐藏关系
 * @param {type} k
 * @returns {undefined}
 */
function gx_hide(k) {
	k = uint(k);
	for (let K in G.lines) {
		K = uint(K);
		if (k && (K !== k)) {
			continue;
		}
		for (let i in G.lines[K]) {
			i = uint(i);
			G.lines[K][i].hide();
		}
	}
}
/**
 * 用于日期滑入滑出显示
 * @param {type} k
 * @returns {undefined}
 */
function slide(k) {
	k = uint(k);
	if (empty(k)) {
		return false;
	}
	if ($(`#bz_block_${k}`).length !== 1) {
		return false;
	}
	let start = 0;
	let width = 12; //视窗显示个数
	let number = 12; //每次挪动个数
	let length = $("#liuri" + k).find("dl").length;
	for (let i = 0; i < length; i++) { //找出起始位
		if ($("#liuri" + k).find("dl:eq(" + i + ")").is(':visible')) {
			start = i;
			break;
		}
	}
	if (start + width > length) {
		for (let i = 0; i < length; i++) {
			$("#liuri" + k).find("dl:eq(" + i + ")").show("slow");
		}
	} else {
		for (let i = 0; i < number; i++) {
			$("#liuri" + k).find("dl:eq(" + (start + i) + ")").hide("slow");
		}
	}
}
/**
 * 智能解析
 * @param {type} k
 * @param {type} s
 * @returns {Boolean}
 */
function form_parse(k, s) {
	let elm = $(`#bz_block_${k}`);
	if ($(elm).length !== 1) {
		return false;
	}
	s = trim(s ?? null);
	if (empty(s)) {
		return false;
	}
	let o = [];
	if (s.indexOf('男') !== -1) { //性别0男1女
		o['xb'] = 0;
	}
	if (s.indexOf('乾') !== -1) {
		o['xb'] = 0;
	}
	if (s.indexOf('女') !== -1) {
		o['xb'] = 1;
	}
	if (s.indexOf('坤') !== -1) {
		o['xb'] = 1;
	}
	let nl = false; //是否农历
	if (s.indexOf('农') !== -1) {
		nl = true;
	}
	if (s.indexOf('阴') !== -1) {
		nl = true;
	}
	for (let i = P.dxy.length - 1; i >= 0; i--) { //大写月份转为数字表示
		let a = [P.dxy[i]];
		if (i === 0) {
			a.push("一月");
		}
		if (i === 10) {
			a.push("十一月");
		}
		if (i === 11) {
			a.push("十二月");
		}
		for (let j in a) {
			if (s.indexOf(a[j]) !== -1) { //月份
				nl = true;
				s = s.replace(a[j], (uint(i) + 1) + '月');
			}
		}
	}
	for (let i = P.dxd.length - 1; i >= 0; i--) { //大写日期转为数字表示
		let a = [P.dxd[i]];
		if (P.dxd[i].indexOf("廿") !== -1) {
			a.push(P.dxd[i].replace("廿", "二十"));
		}
		for (let j in a) {
			if (s.indexOf(a[j]) !== -1) { //日期
				nl = true;
				s = s.replace(a[j], (uint(i) + 1) + "日");
			}
		}
	}
	for (let i = P.dxs.length - 1; i >= 0; i--) { //大写改为数字
		if (s.indexOf(P.dxs[i]) !== -1) { //数字
			nl = true;
			s = s.replaceAll(P.dxs[i], uint(i));
		}
	}
	for (let i = P.cdz.length - 1; i >= 0; i--) { //char of dizhi 解决十二时辰
		if (s.indexOf(P.cdz[i] + "时") !== -1) { //时辰
			o['hh'] = i * 2;
			o['mt'] = 0;
		}
	}
	let n = preg_match_all(/(\d+)/igm, s)[1];
	let m = ['yy', 'mm', 'dd', 'hh', 'mt', 'ss'];
	for (let i in n) {
		if (empty(m[i])) {
			break;
		}
		o[m[i]] = uint(n[i]);
	}
	n = preg_match_all(/(\d{2,4})[\u5e74]/igm, s)[1]; //年
	if (n && n[0]) {
		o['yy'] = n[0];
	}
	n = preg_match_all(/(\d{1,2})[\u6708]/igm, s)[1]; //月
	if (n && n[0]) {
		o['mm'] = n[0];
	}
	n = preg_match_all(/(\d{1,2})[\u65e5]/igm, s)[1]; //日
	if (n && n[0]) {
		o['dd'] = n[0];
	}
	n = preg_match_all(/(\d{1,2})[\u65f6]/igm, s)[1]; //时
	if (n && n[0]) {
		o['hh'] = n[0];
	}
	n = preg_match_all(/(\d{1,2})[\u70b9]/igm, s)[1]; //点
	if (n && n[0]) {
		o['hh'] = n[0];
	}
	n = preg_match_all(/(\d{1,2})[\u5206]/igm, s)[1]; //分
	if (n && n[0]) {
		o['mt'] = n[0];
	}
	n = preg_match_all(/(\d{1,2}):(\d{1,2})/igm, s)[1]; //15:18
	if (n && n[0] && n[1]) {
		o['hh'] = n[0];
		o['mt'] = n[1];
	}
	n = preg_match_all(/(\d{1,2}):(\d{1,2}):(\d{1,2})/igm, s)[1]; //15:18:20
	if (n && n[0] && n[1] && n[2]) {
		o['hh'] = n[0];
		o['mt'] = n[1];
		o['ss'] = n[2];
	}
	let tg = [];
	let dz = [];
	let gz = [];
	let css = preg_match_all(/([\u4e00-\u9fa5]{1})/igm, s)[1]; //切成单个字符:分析直接输入四柱的情况
	let ctg = implode('', P.ctg);
	let cdz = implode('', P.cdz);
	o['nk'] = "";
	for (let i in css) {
		let k = strpos(ctg, css[i]);
		if (k !== false) {
			tg.push(k);
			continue;
		}
		k = strpos(cdz, css[i]);
		if (k !== false) {
			dz.push(k);
			continue;
		}
		o['nk'] += css[i]; //中文字符当成姓名
	}
	o['nk'] = str_replace(["年", "月", "日", "时", "分", "秒", "男", "女"], [""], o['nk']);
	if ((count(tg) >= 4) && (count(dz) >= 4)) {
		for (let i = 0; i <= 3; i++) {
			let n = P.GZ(tg[i], dz[i]);
			if (n === false) {
				break;
			}
			gz.push(n);
		}
		if (count(gz) === 4) { //四柱转公历时间
			let ifs = P.gz2gl(gz[0], gz[1], gz[2], gz[3], date('Y') * 1 - 120, 2);
			if (ifs) {
				ifs = array_reverse(ifs);
				for (let i in ifs) {
					let a = ifs[i][0];
					if (a[0] <= date('Y') * 1) {
						o['nl'] = 0;
						o['yy'] = a[0];
						o['mm'] = a[1];
						o['dd'] = a[2];
						o['hh'] = a[3];
						o['mt'] = a[4];
						o['ss'] = a[5];
						break;
					}
				}
			}
		}
	}
	n = preg_match_all(/(\d{8,})/igm, s)[1]; //2017072823001或者身份证
	if (n && n[0]) {
		n = n[0];
		let length = n.length;
		if (in_array(length, [17, 18])) {
			length = 0;
			o['yy'] = uint(substr(n, 6, 4));
			o['mm'] = uint(substr(n, 10, 2));
			o['dd'] = uint(substr(n, 12, 2));
			o['hh'] = 12;
			o['mt'] = 0;
			o['ss'] = 0;
			o['xb'] = (uint(substr(n, 16, 1)) + 1) % 2;
			o['wz'] = 1;
		}
		if (length >= 4) {
			o['yy'] = uint(substr(n, 0, 4));
		}
		if (length >= 6) {
			o['mm'] = uint(substr(n, 4, 2));
		}
		if (length >= 8) {
			o['dd'] = uint(substr(n, 6, 2));
		}
		if (length >= 10) {
			o['hh'] = uint(substr(n, 8, 2));
		}
		if (length >= 12) {
			o['mt'] = uint(substr(n, 10, 2));
		}
		if (length >= 14) {
			o['ss'] = uint(substr(n, 12, 2));
		}
		if (length >= 15) {
			o['xb'] = uint(substr(n, 14, 1));
		}
		if (length >= 16) {
			o['ct'] = uint(substr(n, 15, 4));
		}
		if (length >= 20) {
			o['wz'] = uint(substr(n, 19, 1));
		}
	}
	for (let i in o) {
		o[i] = trim(o[i]);
	}
	if (isset(o['yy'])) {
		let n = o['yy'].length;
		if (n > 4) {
			o['yy'] = substr(o['yy'], 0, 4);
		}
		if (n === 2) { //解决两位数年份
			if (o['yy'] >= 50) {
				o['yy'] = 1900 + uint(o['yy']);
			}
			if (o['yy'] <= 30) {
				o['yy'] = 2000 + uint(o['yy']);
			}
		}
	}
	if (o['hh'] && (o['hh'] < 12) && (s.indexOf("下午") !== -1)) {
		o['hh'] = uint(o['hh']) + 12;
	}
	if (nl && o['yy'] && o['mm'] && o['dd']) { //农历转公历
		try {
			[o['yy'], o['mm'], o['dd']] = P.Lunar2Solar(o['yy'], o['mm'], o['dd'], (s.indexOf("闰") !== -1));
		} catch (e) {}
	}
	for (let key in o) {
		let em = $(elm).find(":input[name='" + key + "\[\]']").eq(0);
		switch (key) {
			case 'ct': {
				G.zcity[k].set(o[key]);
				break;
			}
			case 'wz': {
				$(em).prop('checked', uint(o[key]) === 1);
				break;
			}
			case 'nk': {
				if (empty(trim($(em).val() ?? null))) {
					$(em).val(o[key]);
				}
				break;
			}
			default: {
				$(em).val(o[key]);
				break;
			}
		}
	}
	$(elm).find(":input[name='yy\[\]']:eq(0)").trigger("change");
}
/**
 * 初始化一个表单
 * @param {type} k
 * @param {type} key
 * @returns {Boolean}
 */
function form_init(k, key) {
	if ($("#bz_content").find(".bz_block").length >= 2 ** 4) {
		return alert("最多排16个盘!");
	}
	k = uint(k);
	if (k) {
		G.k = max(k, G.k) + 1; //供下一次使用
	} else {
		k = G.k++; //自增长
	}
	if ($(`#bz_block_${k}`).length) {
		return alert("已经初始化!");
	}
	let m = Object.assign({}, G.list[key]);
	let et = empty(m);
	body_resize(1); //加多一个空间
	let output = Twig.twig({
		data: $('#twig_form').html(),
		autoescape: true,
		strict_variables: true
	}).render({
		k: k
	});
	$("#bz_content").append(output);
	let elm = $(`#bz_block_${k}`).data({
		"k": k,
		"key": key
	});
	["nk", "xb", "wz", "ps", "ry", "mp"].forEach(function(c, index, cols) {
		let nk = et ? "" : trim(m[1] ?? null);
		let xb = et ? 0 : uint(m[2]);
		let wz = et ? 0 : uint(m[9]);
		let ps = "";
		let ry = 0;
		let mp = et ? 0 : uint(m[0]);
		let vals = [nk, xb, 1, ps, ry, mp]; //默认值
		let oe = $(elm).find(":input[name='" + c + "\[\]']:eq(0)").val(vals[index]).data({
			"c": c,
			"k": k,
			"key": key
		}).on("change", function(e) {
			let v = $(this).val();
			let c = $(this).data("c");
			let k = $(this).data("k");
			let em = $("#bz_block_" + k);
			switch (c) {
				case "nk": {}
				case "xb": {}
				case "wz": {
					$(em).find(":input[name='yy\[\]']:eq(0)").trigger("change");
					break;
				}
				case "ps": {
					form_parse(k, v);
					break;
				}
				case "ry": {
					if ($(this).prop('checked')) { //选择闰月:判断该年是否有闰月
						let ny = $(em).find(":input[name='ny\[\]']:eq(0)").val(); //年份
						ny = uint(ny);
						let ry = P.GetLeap(ny); //该年闰月
						if (ry) {
							$(em).find(":input[name='nm\[\]']:eq(0)").val(ry);
						} else {
							$(this).prop('checked', false);
							return alert("该年无闰月!");
						}
					}
					$(em).find(":input[name='nm\[\]']:eq(0)").trigger("change");
					break;
				}
			}
		});
		if ((c === "wz") && (wz === 1)) {
			$(oe).prop('checked', true);
		}
	});
	["hh", "mt", "ss", "yy", "mm", "dd", "ny", "nm", "nd"].forEach(function(c, index, cols) {
		let hh = et ? 12 : uint(m[6]);
		let mt = et ? 0 : uint(m[7]);
		let ss = et ? 0 : uint(m[8]);
		let yy = et ? date("Y") * 1 : uint(m[3]);
		let mm = et ? date("n") * 1 : uint(m[4]);
		let dd = et ? date("j") * 1 : uint(m[5]);
		let vals = [hh, mt, ss, yy, mm, dd, "", "", ""]; //默认值
		let oe = $(elm).find(":input[name='" + c + "\[\]']:eq(0)").data({
			"c": c,
			"k": k,
			"key": key
		}).val(vals[index]).attr({
			autocomplete: "off",
			title: "点击后支持滚轮和上下键"
		}).on("focus", function(e) {
			$(this).trigger("select");
		}).on("input", function(e) {
			let n = $(this).val();
			let c = $(this).data("c");
			let k = $(this).data("k");
			if ((in_array(c, ["yy", "ny"]) === true) && preg_match(/^\d{0,4}$/, n)) {
				return false;
			}
			if ((in_array(c, ["yy", "ny"]) === false) && preg_match(/^\d{0,2}$/, n)) {
				return false;
			}
			$(this).val("").trigger("select");
			return false;
		}).on("wheel keyup", function(e) {
			if ($(this).is(":focus") === false) { //必须点击
				return false;
			}
			if (in_array(e.type, ["keyup"])) {
				if (in_array(e.keyCode, [38, 40]) === false) {
					return false;
				}
			}
			let n = uint($(this).val());
			if (in_array(e.type, ["wheel"])) {
				if (e.originalEvent.deltaY > 0) { //向下滚
					n += 1;
				}
				if (e.originalEvent.deltaY < 0) {
					n -= 1;
				}
			}
			if (in_array(e.type, ["keyup"])) {
				if (e.keyCode === 38) { //上
					n += 1;
				}
				if (e.keyCode === 40) { //下
					n -= 1;
				}
			}
			n = uint(n);
			$(this).val(n).trigger("change");
			return false;
		}).on("change", function(e) {
			let n = uint($(this).val());
			let c = $(this).data("c");
			let k = $(this).data("k");
			let em = $(`#bz_block_${k}`);
			switch (c) {
				case "yy": //年份变化:修正日期,同步农历
				{
					if (n > G.eyear) {
						$(this).val(G.eyear);
					}
					if (n < G.syear) {
						$(this).val(G.syear);
					}
					$(em).find(":input[name='mm\[\]']:eq(0)").trigger("change"); //年触发月,月触发日
					break;
				}
				case "mm": //月份变化:修正日期,同步农历
				{
					if (n > 12) {
						$(this).val(12);
					}
					if (n < 1) { //1至12
						$(this).val(1);
					}
					$(em).find(":input[name='dd\[\]']:eq(0)").trigger("change"); //日期
					break;
				}
				case "dd": {
					let yy = $(em).find(":input[name='yy\[\]']:eq(0)").val(); //年份
					let mm = $(em).find(":input[name='mm\[\]']:eq(0)").val(); //月份
					let dd = $(em).find(":input[name='dd\[\]']:eq(0)").val(); //日期
					yy = uint(yy);
					mm = uint(mm);
					dd = uint(dd);
					mm = (12 + mm - 1) % 12 + 1; //确保是一个正常的
					let mx = P.GetSolarDays(yy, mm);
					if (dd > mx) {
						dd = mx;
						$(this).val(dd);
					}
					if (dd < 1) {
						dd = 1;
						$(this).val(dd);
					}
					let o = P.Solar2Lunar(yy, mm, dd); //转农历
					$(em).find(":input[name='ny\[\]']:eq(0)").val(o[0]);
					$(em).find(":input[name='nm\[\]']:eq(0)").val(o[1]);
					$(em).find(":input[name='nd\[\]']:eq(0)").val(o[2]);
					$(em).find(":input[name='ry\[\]']:eq(0)").prop('checked', o[3]);
					window.clearTimeout(G.timer[k]); //所有提交都经过此事件
					G.timer[k] = window.setTimeout(function(o) {
						form_submit(o.k);
					}, 250, {
						k: k
					});
					break;
				}
				case "ny": {
					$(em).find(":input[name='nm\[\]']:eq(0)").trigger("change"); //农历月份
					break;
				}
				case "nm": {
					if (n > 12) {
						$(this).val(12);
					}
					if (n < 1) { //1至12
						$(this).val(1);
					}
					$(em).find(":input[name='nd\[\]']:eq(0)").trigger("change"); //农历日期
					break;
				}
				case "nd": {
					let ny = $(em).find(":input[name='ny\[\]']:eq(0)").val(); //年份
					let nm = $(em).find(":input[name='nm\[\]']:eq(0)").val(); //月份
					let nd = $(em).find(":input[name='nd\[\]']:eq(0)").val(); //日期
					ny = uint(ny);
					nm = uint(nm);
					nd = uint(nd);
					nm = (12 + nm - 1) % 12 + 1; //确保是一个正常的
					let ry = $(em).find(":input[name='ry\[\]']:eq(0)"); //是否闰月
					if ($(ry).prop('checked')) { //闰月
						if (P.GetLeap(ny) !== nm) { //该月不是闰月
							$(ry).prop('checked', false);
						}
					}
					ry = $(ry).prop('checked'); //转换了
					let mx = P.GetLunarDays(ny, nm, ry); //该农历月份有多少天
					if (nd > mx) {
						nd = mx;
						$(this).val(nd);
					}
					if (nd < 1) {
						nd = 1;
						$(this).val(nd);
					}
					let [yy, mm, dd] = P.Lunar2Solar(ny, nm, nd, ry);
					if (yy > G.eyear) { //转换出来的公历不在范围内
						yy = G.eyear;
						mm = 12;
						dd = 31;
					}
					if (yy < G.syear) {
						yy = G.syear;
						mm = 1;
						dd = 1;
					}
					$(em).find(":input[name='dd\[\]']:eq(0)").val(dd);
					$(em).find(":input[name='mm\[\]']:eq(0)").val(mm);
					$(em).find(":input[name='yy\[\]']:eq(0)").val(yy).trigger("change");
					break;
				}
				case "hh": {
					if (n > 23) {
						$(this).val(23);
					}
					if (n < 0) {
						$(this).val(0);
					}
					$(em).find(":input[name='yy\[\]']:eq(0)").trigger("change"); //日期
					break;
				}
				case "mt": {}
				case "ss": {
					if (n > 59 || n < 0) {
						n = (n + 60) % 60;
						$(this).val(n);
					}
					$(em).find(":input[name='yy\[\]']:eq(0)").trigger("change"); //日期
					break;
				}
			}
		});
	});
	G.zcity[k] = new selectmenu();
	G.zcity[k].init($(elm).find("span.zcity:eq(0)"), JW, et ? 0 : uint(m[10]), function(cb) {
		let k = cb.k;
		let em = $("#bz_block_" + k);
		$(em).find(":input[name='yy\[\]']:eq(0)").trigger("change");
	}, {
		cb: {
			k: k
		},
		force: true,
		selectWidth: 180,
		optionText: '--不考虑真太阳时--'
	});
	if (form_parse(k, $_GET[k]) === false) { //强制提交
		$(elm).find(":input[name='yy\[\]']:eq(0)").trigger("change");
	}
}
/**
 * 提交表单
 * @param {type} k
 * @param {type} save
 * @returns {Boolean}
 */
function form_submit(k, save) {
	let elm = $(`#bz_block_${k}`);
	if ($(elm).length !== 1) {
		return alert("表单出错了!");
	}
	if (save && (empty(G.user) || empty(G.pw_hash))) {
		return $("#loginme").find(":input[type='button']:eq(0)").trigger('click');
	}
	let key = $(elm).data("key");
	let em = $(elm).find(":input[name='xb\[\]']:eq(0)");
	let xb = uint($(em).val());
	if (in_array(xb, [0, 1]) === false) {
		$(em).focus();
		return alert("请选择性别!");
	}
	em = $(elm).find(":input[name='yy\[\]']:eq(0)");
	let yy = uint($(em).val());
	$(em).val(yy); //标准化
	if (yy > G.eyear || yy < G.syear) {
		$(em).focus();
		return alert("年份不正常!");
	}
	em = $(elm).find(":input[name='mm\[\]']:eq(0)");
	let mm = uint($(em).val());
	$(em).val(mm); //标准化
	if (mm > 12 || mm < 1) {
		$(em).focus();
		return alert("月份不正确!");
	}
	em = $(elm).find(":input[name='dd\[\]']:eq(0)");
	let dd = uint($(em).val());
	$(em).val(dd); //标准化
	if (dd > 31 || dd < 1) {
		$(em).focus();
		return alert("日期不正确!");
	}
	if (P.ValidDate(yy, mm, dd) === false) {
		$(em).focus();
		return alert("日期不正常!");
	}
	em = $(elm).find(":input[name='hh\[\]']:eq(0)");
	let hh = uint($(em).val());
	$(em).val(hh); //标准化
	if (hh > 23 || hh < 0) {
		$(em).focus();
		return alert("时间不正确!");
	}
	em = $(elm).find(":input[name='mt\[\]']:eq(0)");
	let mt = uint($(em).val());
	$(em).val(mt); //标准化
	if (mt > 59 || mt < 0) {
		$(em).focus();
		return alert("分钟不正确!");
	}
	em = $(elm).find(":input[name='ss\[\]']:eq(0)");
	let ss = uint($(em).val());
	$(em).val(ss); //标准化
	if (ss > 59 || ss < 0) {
		$(em).focus();
		return alert("秒数不正确!");
	}
	em = $(elm).find(":input[name='wz\[\]']:eq(0)");
	let wz = $(em).prop('checked') ? 1 : 0;
	em = $(elm).find(":input[name='nk\[\]']:eq(0)");
	let nk = trim($(em).val() ?? null);
	if (save && empty(nk)) {
		$(em).focus();
		return alert("请输入姓名!");
	}
	em = $(elm).find(":input[name='nt\[\]']:eq(0)");
	let nt = trim($(em).val() ?? null); //notes
	if (empty(save) && empty(nt) && isset(G.list[key])) {
		nt = trim(G.list[key][11] ?? null);
	}
	em = $(elm).find(":input[name='mp\[\]']:eq(0)");
	let mp = uint($(em).val()); //后端ID
	let ix = G.zcity[k].get();
	ix = uint(ix);
	let ct = (count(JW[ix]) === 4) ? ix : 0;
	let jw = JW[ct];
	let o = G.posts[k] = {
		yy: yy,
		mm: mm,
		dd: dd,
		hh: hh,
		mt: mt,
		ss: ss,
		xb: xb,
		ct: ct,
		wz: wz,
		nk: nk,
		nt: nt
	};
	if (save) {
		return form_ajax(array_merge(o, {
			user: G.user,
			pw_hash: G.pw_hash,
			act: "save",
			mp: mp,
			k: k
		}), function(o) {
			switch (o.error) {
				case 1000: {
					alert("请输入姓名!");
					break;
				}
				case 1001: {
					alert("姓名有重复!");
					break;
				}
				case 1002: {
					alert("已成功保存!");
					break;
				}
				case 2001: //有可能在别处改了密码
				{
					alert("请重新登录!");
					$("#welcome").find(":input[type='button']:eq(0)").trigger('click');
					$("#loginme").find(":input[type='button']:eq(0)").trigger('click');
					break;
				}
				default: {
					alert(o.error ? "错误代码为:[" + o.error + "]" : "已成功保存!");
					break;
				}
			}
			if (o.mp) {
				let elm = $("#bz_block_" + o.k);
				$(elm).find(":input[name='mp\[\]']:eq(0)").val(o.mp);
			}
		});
	}
	G.query[k] = sprintf("%04s%02s%02s%02s%02s%02s%01s%04s%01s", yy, mm, dd, hh, mt, ss, xb, ct, wz);
	P.zwz = kvs["zwzs"];
	let p = P.fatemaps(o.xb, o.yy, o.mm, o.dd, o.hh, o.mt, o.ss, jw ? jw[2] : null, jw ? jw[3] : null, {
		dyk: -1,
		lyk: -1,
		lmk: -1,
		lrk: -1,
		lsk: -1
	});
	if ($(elm).find(".bz_paipan_result").length) { //之前排过
		gx_remove(k);
		$(elm).find(".bz_paipan_result").remove();
	}
	let output = Twig.twig({
		data: $('#twig_maps').html(),
		autoescape: true,
		strict_variables: true
	}).render({
		kvs: kvs,
		k: k,
		p: p,
		o: o
	});
	$(elm).append(output);
	if (empty(kvs["jbzl"])) { //隐藏基本资料
		$(elm).find(".bz_paipan_select,.bz_analysis").hide();
	}
	$(elm).find(".bz_paipan_result").show("fast", "linear", function() {
		body_origin();
		gx(k, p);
	});
}
/**
 * 删除一个盘
 * @param {type} k
 * @returns {Boolean}
 */
function form_remove(k) {
	let elm = $(`#bz_block_${k}`);
	if ($(elm).length !== 1) {
		return false;
	}
	gx_hide(); //隐藏所有关系
	$(elm).hide("fast", "linear", function() {
		let k = $(this).data("k");
		delete G.query[k];
		$(this).remove();
		body_origin();
		body_resize();
		gx_remove(k);
		gx_resize(); //重新定位关系图
		if ($("#bz_content").find(".bz_block").length === 0) {
			form_init(0, -1);
		}
	});
}
/**
 * 退出登录.一次只能登录一个账号
 * @returns {undefined}
 */
function form_logout() {
	db.table("bazi_users").clear().then(function() {
		G.user = "";
		G.pw_hash = "";
	}).catch(function(e) {
		//console.log(e.stack || e);
	}).finally(function() {
		if (empty(G.user) || empty(G.pw_hash)) {
			$("#loginme").show();
			$("#welcome").hide().find("strong:eq(0)").html(G.user);
		} else {
			$("#welcome").show().find("strong:eq(0)").html(G.user);
			$("#loginme").hide();
		}
	});
}
/**
 * 排指定盘
 * @param {type} key
 * @returns {Boolean}
 */
function form_maps(key) {
	let m = G.list[key];
	if (empty(m)) {
		return false;
	}
	let em = $("#maps-" + m[0]);
	if (empty($(em).length)) {
		return false;
	}
	let ck = $(em).prop("checked") ? false : true;
	$(em).prop("checked", ck);
	$("#bz_content").find(".bz_block").each(function(index, domEle) {
		if ($(this).find(":input[name='mp\[\]']:eq(0)").val() == m[0]) {
			let k = $(this).data("k"); //先删除
			form_remove(k);
		}
	});
	ck && form_init(0, key);
}
/**
 * 用户登录[自动注册]
 * @returns {undefined}
 */
function form_login() {
	let host = parse_url(location.href, 'PHP_URL_HOST');
	if(str_ends_with(host, '.cipuji.com') === false){
		return alert("此版本为单机版!");
	}
	let output = Twig.twig({
		data: $('#twig_login').html(),
		autoescape: true,
		strict_variables: true
	}).render({});
	let _dialog = $(output).dialog({
		modal: true,
		title: "登录[自动注册]!",
		width: 500,
		height: 300,
		autoOpen: true,
		resizable: false,
		closeText: "取消",
		closeOnEscape: true,
		close: function(event, ui) {
			$(this).dialog("destroy");
		},
		buttons: [{
			text: "取消",
			click: function() {
				$(this).dialog("close");
			}
		}, {
			text: "登录",
			click: function() {
				let em = $(this).find(':input[name="user"]:eq(0)');
				let user = trim($(em).val() ?? null);
				if (validateEmail(user) == false) {
					$(em).focus();
					alert('请用真实邮箱地址!');
					return false;
				}
				em = $(this).find(':input[name="pw"]:eq(0)');
				let pw = trim($(em).val() ?? null);
				if (strlen(pw) < 6 || strlen(pw) > 24) {
					$(em).focus();
					alert('密码需6至24个字符!');
					return false;
				}
				form_ajax({
					act: "login",
					user: user,
					pw: pw
				}, function(o) {
					switch (o.error) {
						case 0: {
							break;
						}
						case 2000: {
							alert("请用真实邮箱地址!");
							break;
						}
						case 2001: {
							alert("密码不正确!");
							break;
						}
						default: {
							alert("错误代码为:[" + o.error + "]");
							break;
						}
					}
					if (o.user && o.pw_hash) {
						db.table("bazi_users").clear().then(function() {
							G.user = o.user;
							G.pw_hash = o.pw_hash;
							db.table("bazi_users").put({
								user: o.user,
								pw_hash: o.pw_hash
							});
						}).catch(function(e) {
							//console.log(e.stack || e);
						}).finally(function() {
							if (empty(G.user) || empty(G.pw_hash)) {
								$("#loginme").show();
								$("#welcome").hide().find("strong:eq(0)").html(G.user);
							} else {
								alert("欢迎:" + G.user);
								$("#welcome").show().find("strong:eq(0)").html(G.user);
								$("#loginme").hide();
							}
							$(_dialog).dialog("close");
						});
					}
				});
			}
		}]
	});
}

function form_ajax(data, cb) {
	$.ajax("./api/bazi.php", {
		type: "POST",
		xhrFields: {
			withCredentials: true
		},
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		},
		dataType: "json",
		crossDomain: true,
		data: data,
		success: cb,
		statusCode: {
			403: function() {
				let _dialog = $('<div class="cf-turnstile" id="cf-turnstile"></div>').dialog({
					modal: true,
					title: "",
					width: 500,
					height: 300,
					autoOpen: true,
					resizable: false,
					closeText: "关闭",
					closeOnEscape: true,
					close: function(event, ui) {
						$(this).dialog("destroy");
					},
					open: function() {
						//$(this).dialog("widget").find(".ui-dialog-titlebar").hide();
						turnstile.render('#cf-turnstile', {
							sitekey: '0x4AAAAAABc3qI9KBrnbKImZ',
							theme: 'light',
							callback: function() {
								form_ajax(data, cb);
								$(_dialog).dialog("close");
							}
						});
					}
				});
			}
		}
	});
}
/**
 * 修改地址栏
 * @returns {undefined}
 */
function body_origin() {
	if (history.pushState && typeof URL !== 'undefined') {
		let u = new URL(window.top.location.href);
		let newSearch = (count(G.query) ? "?" : "") + http_build_query(G.query, '');
		let targetUrl = u.pathname + newSearch;
		let o = {
			Title: window.document.title,
			Url: targetUrl
		};
		try {
			history.pushState(o, o.Title, targetUrl);
		} catch (e) {
			console.error("pushState 失败:", e);
		}
	}
}
/**
 * 加宽页面
 * @param {type} c
 * @returns {undefined}
 */
function body_resize(c) {
	c = uint(c);
	let n = $("#bz_content").find(".bz_block").length;
	let w = (n + c) * 801;
	let W = $(window).width();
	$(".navigation").css({
		width: max(w, W) + "px"
	});
	$(".bz_toolbar").css({
		width: max(w, W) + "px"
	});
	$("#bz_content").css({
		width: w + "px"
	});
	//c && $(window).scrollLeft(uint(w - W)); //滚到最右边
}

function alert(message) {
	return $("<div><p>" + message + "</p></div>").dialog({
		modal: true,
		title: "提示!",
		width: 300,
		height: 200,
		autoOpen: true,
		resizable: false,
		closeText: "关闭",
		closeOnEscape: true,
		close: function(event, ui) {
			$(this).dialog("destroy");
		},
		buttons: [{
			text: "好的",
			click: function() {
				$(this).dialog("close");
			}
		}]
	});
}
/**
 * 名单列表
 * @returns {jQuery}
 */
function form_list() {
	if (empty(G.user) || empty(G.pw_hash)) {
		return $("#loginme").find(":input[type='button']:eq(0)").trigger('click');
	}
	return form_ajax({
		act: "list",
		user: G.user,
		pw_hash: G.pw_hash
	}, function(o) {
		switch (o.error) {
			case 0: {
				break;
			}
			case 2001: { //有可能在别处改了密码
				alert("请重新登录!");
				$("#welcome").find(":input[type='button']:eq(0)").trigger('click');
				$("#loginme").find(":input[type='button']:eq(0)").trigger('click');
				break;
			}
			default: {
				alert("错误代码为:[" + o.error + "]");
				break;
			}
		}
		if (o.error) {
			return false;
		}
		if (empty(o.list)) {
			return alert("没有保存的名单!");
		}
		G.list = o.list;
		renderList();
	});
}

function renderList() {
	let filtered = G.list.filter(function(item) {
		return item && item[1].indexOf(G.state.keyword) !== -1;
	});
	G.state.links = Math.ceil(filtered.length / G.state.size) || 1;
	G.state.start = (G.state.page - 1) * G.state.size; //当前起始位
	let list = filtered.slice(G.state.start, G.state.start + G.state.size);
	let output = Twig.twig({
		data: $('#twig_list').html(),
		autoescape: true,
		strict_variables: true
	}).render({
		list: list,
		state: G.state
	});
	let $dialog = $("#list-dialog-container");
	if ($dialog.length && $dialog.is(":data(ui-dialog)")) {
		$dialog.html(output);
	} else {
		$dialog = $('<div id="list-dialog-container"></div>').html(output);
		$dialog.dialog({
			modal: true,
			title: "名单!",
			width: 1500,
			height: 800,
			autoOpen: true,
			resizable: false,
			open: function() {
				$(this).css({
					"padding": "0",
					"overflow": "hidden"
				});
				$(".ui-widget-overlay").css("z-index", 9998);
				$(this).closest(".ui-dialog").css("z-index", 9999);
			},
			close: function() {
				$(this).dialog("destroy").remove();
			}
		});
	}
}
window.exportCsv = function() {
	let maps = [
		["编号", "姓名", "性别0男1女", "年[公历]", "月[公历]", "日[公历]", "时", "分", "秒", "时辰是否未知", "地区", "批注"]
	];
	for (let i in G.list) {
		let a = [...G.list[i]];
		a[0] = parseInt(i) + 1;
		maps.push(a);
	}
	let blob = new Blob(["\ufeff" + Papa.unparse(maps)], {
		type: 'text/csv;charset=utf-8;'
	});
	let link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = "名单列表.csv";
	link.click();
};
$(document).off('change', '#search_input').on('change', '#search_input', function() {
	G.state.keyword = $(this).val();
	G.state.page = 1;
	renderList();
});
$(function() {
	window.db = new Dexie("bazi-paipan");
	db.version(1).stores({
		bazi_kvs: '&key,expire', //key - value - storage 一些中间数据
		bazi_users: '&user' //已登录用户表 user字段为邮件地址,只有一条
	});
	db.open().then(function() {
		return db.table("bazi_kvs").where("expire").between(1, time()).delete().then(function(n) {
			return db.table("bazi_kvs").filter(a => a.type === 1).each(function(a) {
				window.kvs[a.key] = a.value;
			}).then(function() {
				return db.table("bazi_users").toArray();
			});
		}).then(function(list) {
			list.forEach(function(a, k) {
				G.user = a["user"];
				G.pw_hash = a["pw_hash"];
			});
			if (empty(G.user) || empty(G.pw_hash)) {
				$("#loginme").show();
				$("#welcome").hide().find("strong:eq(0)").html(G.user);
			} else {
				$("#welcome").show().find("strong:eq(0)").html(G.user);
				$("#loginme").hide();
			}
			$("#zwzs,#swap,#wxws,#jbzl,#xchh,#xsss,#xscg").each(function(index, elm) { //默认值
				let key = $(this).attr("id");
				$(this).prop('checked', $(this).val() == kvs[key]);
			}).on("change", function(e) {
				let o = Object.assign({
					k: 0
				}, arguments[1]); //手动触发可能传数据
				let key = $(this).attr("id");
				let value = $(this).prop('checked') ? 1 : 0;
				kvs[key] = value;
				db.table("bazi_kvs").put({ //保存配置
					type: 1,
					key: key,
					value: value,
					expire: 0
				});
				$("#bz_content").find(".bz_block").each(function(index, elm) {
					let k = $(this).data("k");
					if (o.k && (k != o.k)) { //仅针对某个
						return true;
					}
					switch (key) {
						case "zwzs": //早晚子时
						{
							$(this).find(":input[name='yy\[\]']:eq(0)").trigger("change");
							break;
						}
						case "swap": //四柱顺排
						{
							for (let j = 1; j <= 3; j++) {
								if (value === 0) {
									$("#mp" + k + "-" + j).insertBefore($("#mp" + k + "-" + (j - 1)));
								}
								if (value === 1) {
									$("#mp" + k + "-" + j).insertAfter($("#mp" + k + "-" + (j - 1)));
								}
							}
							gx_resize(k);
							break;
						}
						case "wxws": //五行五色
						{
							for (let i = 0; i <= 4; i++) {
								$(this).find(".wx" + i).each(function() {
									if (value === 0) {
										$(this).addClass("wx");
									}
									if (value === 1) {
										$(this).removeClass("wx");
									}
								});
							}
							break;
						}
						case "jbzl": //基本资料
						{
							if (value === 1) {
								$(this).find(".bz_paipan_select,.bz_analysis").show("fast", function() {
									gx_resize(k);
								});
							}
							if (value === 0) {
								$(this).find(".bz_paipan_select,.bz_analysis").hide("fast", function() {
									gx_resize(k);
								});
							}
							break;
						}
						case "xchh": //刑冲合害
						{
							if (value === 1) {
								$(this).find("div.xchh").show();
							}
							if (value === 0) {
								$(this).find("div.xchh").hide();
							}
							gx_resize(k);
							break;
						}
						case "xscg": //显示藏干
						{
							if (value && $("#xsss").prop('checked')) {
								$("#xsss").prop('checked', false).trigger("change");
							}
							$(this).find("span[data-turn='2']").css('display', value ? 'inline' : 'none');
							break;
						}
						case "xsss": //显示十神
						{
							if (value && $("#xscg").prop('checked')) {
								$("#xscg").prop('checked', false).trigger("change");
							}
							$(this).find("span[data-turn='1']").css('display', value ? 'inline' : 'none');
							break;
						}
					}
				});
			});
			for (let k in $_GET) {
				k = uint(k);
				if (k) {
					form_init(k, -1);
				}
			}
			if ($("#bz_content").find(".bz_block").length === 0) {
				form_init(0, -1);
			}
		});
	}).catch(function(e) {
		console.log(e.stack || e);
	}).finally(function() {});
});