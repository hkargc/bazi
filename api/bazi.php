<?php

/**
 * 简单的字段说明
 */
$isAjax = isset($_SERVER["HTTP_X_REQUESTED_WITH"]) && ($_SERVER["HTTP_X_REQUESTED_WITH"] == "XMLHttpRequest") ? true : false; //是否Ajax请求

if (empty($isAjax)) {
	die("[]");
}
if (empty($_POST)) {
	die("[]");
}
if ($_POST['act'] == "login") { //用户登录
	$_POST['user']; //登录名
	$_POST['pw']; //密码
	//...完成登录或自动注册
	
	//返回这些字段
	$user = ['uid' => '用户ID,int', 'user' => '用户名', 'pw_hash' => '密码HASH,之后的每次请求都带它回来', 'error' => '0成功;2000用户名格式不对;2001密码不对;非0为其他错误'];

	die(json_encode($user));
}
if ($_POST['act'] == "save") { //保存排盘
	$_POST['user']; //登录名
	$_POST['pw_hash']; //密码HASH
	//...登录验证
	$user = ['uid' => '用户ID,int', 'user' => '用户名', 'pw_hash' => '密码HASH', 'error' => '0成功;2000用户名格式不对;2001密码不对;非0为其他错误'];
	if (empty($user['uid'])) { //验证不通过
		$result = array("error" => 2001);
	} else {
		//...保存排盘
		$_POST['yy']; //公历年
		$_POST['mm']; //月
		$_POST['dd']; //日
		$_POST['hh']; //时
		$_POST['mt']; //分
		$_POST['ss']; //秒
		$_POST['wz']; //是否时辰未知
		$_POST['xb']; //性别0男1女
		$_POST['ct']; //城市ID,对应的是JW.js里面的索引值
		$_POST['nt']; //note.批注
		$_POST['nk']; //nick.命主姓名
		//增删改查
		
		//返回这些字段
		$result = ['mp' => '系统里面的命盘ID,int'];
	}
	$result['k'] = (int) $_POST['k'];

	die(json_encode($result));
}
if ($_POST['act'] == "list") { //该登录用户保存的所有排盘
	$_POST['user']; //登录名
	$_POST['pw_hash']; //密码HASH
	//登录验证
	$user = ['uid' => '用户ID,int', 'user' => '用户名', 'pw_hash' => '密码HASH', 'error' => '0成功;2000用户名格式不对;2001密码不对;非0为其他错误'];
	if (empty($user['uid'])) { //验证不通过
		$result = array("error" => 2001);
	} else {
		$result = array("error" => 0);

		$list = [];
		/*$list[] = array(
		  $a['mp'], //系统里面的命盘ID,int
		  $a['nk'], //以下对应的是save中的字段
		  $a['xb'],
		  $a['yy'],
		  $a['mm'],
		  $a['dd'],
		  $a['hh'],
		  $a['mt'],
		  $a['ss'],
		  $a['wz'],
		  $a['ct'],
		  $a['nt']
		  );*/
		//返回这些字段
		$result["list"] = $list;
	}

	die(json_encode($result));
}
